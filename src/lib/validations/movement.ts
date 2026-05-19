import { z } from 'zod'

/** UUID opcional: cadena vacía → undefined (evita "Invalid uuid" en UI). */
function optionalUuid(message = 'Selecciona un valor válido de la lista') {
  return z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.string().uuid(message).optional()
  )
}

/** Enums: valores alineados a columnas / RPC; nombres en inglés (código). */
export const MovementTypeEnum = z.enum(['income', 'expense', 'transfer', 'adjustment'])
export const MovementStatusEnum = z.enum(['draft', 'pending', 'approved', 'rejected', 'cancelled'])
export const MovementMethodEnum = z.enum(['cash', 'transfer', 'card', 'digital', 'other'])
export const ContactTypeEnum = z.enum(['cliente', 'proveedor'])
export const AdjustmentReasonEnum = z.enum(['reconciliation', 'correction', 'other'])
export type AdjustmentReason = z.infer<typeof AdjustmentReasonEnum>
export const DocumentTypeEnum = z.enum(['invoice', 'receipt', 'ticket', 'other'])
export const FundOwnerEnum = z.enum(['company', 'client_advance'])

/** Medios de cobro/pago — motor SQL `operation_components` */
export const MovementComponentTypeEnum = z.enum([
  'operative_cash',
  'operative_bank',
  'client_receivable',
  'supplier_payable',
])

export const movementComponentSchema = z
  .object({
    componentType: MovementComponentTypeEnum,
    accountId: optionalUuid('Selecciona la cuenta para efectivo o banco'),
    contactId: optionalUuid('Selecciona el contacto para cuenta corriente'),
    amount: z.number().positive(),
    currency: z.string().min(3).max(3).optional(),
  })
  .superRefine((row, ctx) => {
    if (row.componentType === 'operative_cash' || row.componentType === 'operative_bank') {
      if (!row.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecciona la cuenta para efectivo o banco',
          path: ['accountId'],
        })
      }
    } else if (!row.contactId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona el contacto para cuenta corriente',
        path: ['contactId'],
      })
    }
  })

export type MovementComponentRow = z.infer<typeof movementComponentSchema>

/** Payload snake_case para RPC `set_operation_components` */
export function mapMovementComponentsToRpcJson(
  rows: MovementComponentRow[],
  defaultCurrency: string
): Record<string, unknown>[] {
  return rows.map((c) => ({
    component_type: c.componentType,
    account_id: c.accountId ?? null,
    contact_id: c.contactId ?? null,
    amount: c.amount,
    currency: c.currency ?? defaultCurrency,
  }))
}

/** Texto guardado cuando en transferencia no hay memo o es más corto que el mínimo general. */
export const DEFAULT_TRANSFER_DESCRIPTION = 'Transferencia entre cuentas'

const baseMovementSchemaObject = z.object({
  type: MovementTypeEnum,
  date: z.coerce.date(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currency: z.string().default('ARS'),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  method: MovementMethodEnum.default('cash'),
  accountId: optionalUuid('Selecciona la cuenta'),
  categoryId: optionalUuid('Selecciona la categoría'),
  contactId: optionalUuid('Selecciona el contacto'),
  contactType: ContactTypeEnum.optional(),
  sourceAccountId: optionalUuid('Selecciona la cuenta origen'),
  destinationAccountId: optionalUuid('Selecciona la cuenta destino'),
  adjustmentReason: AdjustmentReasonEnum.optional(),
  documentType: DocumentTypeEnum.optional(),
  documentNumber: z.string().max(50).optional(),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
  projectId: optionalUuid('Selecciona el proyecto'),
  fundOwner: FundOwnerEnum.default('company'),
  movementComponents: z.array(movementComponentSchema).optional(),
})

export const createMovementSchema = baseMovementSchemaObject
  .superRefine((data, ctx) => {
  const descTrim = (data.description ?? '').trim()
  if (data.type !== 'transfer' && descTrim.length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 3,
      inclusive: true,
      type: 'string',
      message: 'La descripción debe tener al menos 3 caracteres',
      path: ['description'],
    })
  }

  if (data.type === 'income' || data.type === 'expense') {
    if (!data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La cuenta es requerida para ingresos y egresos',
        path: ['accountId'],
      })
    }
    if (!data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La categoría es requerida para ingresos y egresos',
        path: ['categoryId'],
      })
    }
    if (!data.movementComponents?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El desglose de medios de pago es obligatorio para ingresos y egresos',
        path: ['movementComponents'],
      })
    }
  }

  if (data.type === 'transfer') {
    if (!data.sourceAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La cuenta origen es requerida para transferencias',
        path: ['sourceAccountId'],
      })
    }
    if (!data.destinationAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La cuenta destino es requerida para transferencias',
        path: ['destinationAccountId'],
      })
    }
    if (data.sourceAccountId && data.destinationAccountId && data.sourceAccountId === data.destinationAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La cuenta origen y destino deben ser diferentes',
        path: ['destinationAccountId'],
      })
    }
  }

  if (data.type === 'adjustment') {
    if (!data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La cuenta es requerida para ajustes',
        path: ['accountId'],
      })
    }
    if (!data.adjustmentReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El motivo del ajuste es requerido',
        path: ['adjustmentReason'],
      })
    }
  }
}).superRefine((data, ctx) => {
  if (!data.movementComponents?.length) return

  const sum = data.movementComponents.reduce((acc, c) => acc + c.amount, 0)
  if (Math.round(sum * 100) !== Math.round(data.amount * 100)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La suma de medios de pago debe ser igual al monto total del movimiento',
      path: ['movementComponents'],
    })
  }

  data.movementComponents.forEach((c, i) => {
    if (data.type === 'income' && c.componentType === 'supplier_payable') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'En ingresos no se usa cuenta corriente de proveedor',
        path: ['movementComponents', i, 'componentType'],
      })
    }
    if (data.type === 'expense' && c.componentType === 'client_receivable') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'En egresos no se usa cuenta corriente de cliente',
        path: ['movementComponents', i, 'componentType'],
      })
    }
  })
})
  .transform((data) => {
    if (data.type === 'transfer') {
      const t = data.description.trim()
      if (t.length < 3) {
        return { ...data, description: DEFAULT_TRANSFER_DESCRIPTION }
      }
      return { ...data, description: t }
    }
    return { ...data, description: data.description.trim() }
  })

export const updateMovementSchema = baseMovementSchemaObject
  .partial()
  .extend({
    id: z.string().uuid(),
  })
  .superRefine((data, ctx) => {
    if (data.description !== undefined) {
      const d = data.description.trim()
      const kind = data.type
      const needsMemo =
        kind === undefined
          ? d.length < 3
          : kind !== 'transfer' && d.length < 3
      if (needsMemo) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 3,
          inclusive: true,
          type: 'string',
          message: 'La descripción debe tener al menos 3 caracteres',
          path: ['description'],
        })
      }
    }
  })
  .superRefine((data, ctx) => {
    if (!data.movementComponents?.length) return
    const amt = data.amount
    if (amt === undefined) return
    const sum = data.movementComponents.reduce((acc, c) => acc + c.amount, 0)
    if (Math.round(sum * 100) !== Math.round(amt * 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La suma de medios de pago debe ser igual al monto total',
        path: ['movementComponents'],
      })
    }
  })
  .transform((data) => {
    if (data.type === 'transfer' && data.description !== undefined) {
      const t = data.description.trim()
      return {
        ...data,
        description: t.length < 3 ? DEFAULT_TRANSFER_DESCRIPTION : t,
      }
    }
    if (data.description !== undefined) {
      return { ...data, description: data.description.trim() }
    }
    return data
  })

export const movementFiltersSchema = z.object({
  status: z.array(MovementStatusEnum).optional(),
  type: z.array(MovementTypeEnum).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(50),
})

export const updateMovementStatusSchema = z
  .object({
    id: z.string().uuid(),
    status: MovementStatusEnum,
    reason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'rejected' || data.status === 'cancelled') {
      const trimmed = (data.reason ?? '').trim()
      if (!trimmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El motivo es obligatorio',
          path: ['reason'],
        })
      }
    }
  })

export type CreateMovementInput = z.input<typeof createMovementSchema>
export type UpdateMovementInput = z.input<typeof updateMovementSchema>
export type MovementFilters = z.infer<typeof movementFiltersSchema>
export type UpdateMovementStatusInput = z.infer<typeof updateMovementStatusSchema>
export type MovementType = z.infer<typeof MovementTypeEnum>
export type MovementStatus = z.infer<typeof MovementStatusEnum>
export type MovementMethod = z.infer<typeof MovementMethodEnum>
export type FundOwner = z.infer<typeof FundOwnerEnum>
export type MovementComponentType = z.infer<typeof MovementComponentTypeEnum>
