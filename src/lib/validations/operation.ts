import { z } from 'zod'

/** Enums: valores alineados a columnas / RPC; nombres en inglés (código). */
export const OperationTypeEnum = z.enum(['income', 'expense', 'transfer', 'adjustment'])
export const OperationStatusEnum = z.enum(['draft', 'pending', 'approved', 'posted', 'rejected'])
export const OperationMethodEnum = z.enum(['cash', 'transfer', 'card', 'digital', 'other'])
export const ContactTypeEnum = z.enum(['cliente', 'proveedor'])
export const AdjustmentReasonEnum = z.enum(['reconciliation', 'correction', 'other'])
export type AdjustmentReason = z.infer<typeof AdjustmentReasonEnum>
export const DocumentTypeEnum = z.enum(['invoice', 'receipt', 'ticket', 'other'])
export const FundOwnerEnum = z.enum(['company', 'client_advance'])

/** Medios de cobro/pago — motor SQL `operation_components` */
export const OperationComponentTypeEnum = z.enum([
  'operative_cash',
  'operative_bank',
  'client_receivable',
  'supplier_payable',
])

export const operationComponentSchema = z
  .object({
    componentType: OperationComponentTypeEnum,
    accountId: z.string().uuid().optional(),
    contactId: z.string().uuid().optional(),
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

export type OperationComponentRow = z.infer<typeof operationComponentSchema>

/** Payload snake_case para RPC `set_operation_components` */
export function mapOperationComponentsToRpcJson(
  rows: OperationComponentRow[],
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

const baseOperationSchemaObject = z.object({
  type: OperationTypeEnum,
  date: z.coerce.date(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currency: z.string().default('ARS'),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  method: OperationMethodEnum.default('cash'),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  contactType: ContactTypeEnum.optional(),
  sourceAccountId: z.string().uuid().optional(),
  destinationAccountId: z.string().uuid().optional(),
  adjustmentReason: AdjustmentReasonEnum.optional(),
  documentType: DocumentTypeEnum.optional(),
  documentNumber: z.string().max(50).optional(),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
  projectId: z.string().uuid().optional(),
  fundOwner: FundOwnerEnum.default('company'),
  operationComponents: z.array(operationComponentSchema).optional(),
})

export const createOperationSchema = baseOperationSchemaObject
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
  if (!data.operationComponents?.length) return

  const sum = data.operationComponents.reduce((acc, c) => acc + c.amount, 0)
  if (Math.round(sum * 100) !== Math.round(data.amount * 100)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La suma de medios de pago debe ser igual al monto total de la operación',
      path: ['operationComponents'],
    })
  }

  data.operationComponents.forEach((c, i) => {
    if (data.type === 'income' && c.componentType === 'supplier_payable') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'En ingresos no se usa cuenta corriente de proveedor',
        path: ['operationComponents', i, 'componentType'],
      })
    }
    if (data.type === 'expense' && c.componentType === 'client_receivable') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'En egresos no se usa cuenta corriente de cliente',
        path: ['operationComponents', i, 'componentType'],
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

export const updateOperationSchema = baseOperationSchemaObject
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
    if (!data.operationComponents?.length) return
    const amt = data.amount
    if (amt === undefined) return
    const sum = data.operationComponents.reduce((acc, c) => acc + c.amount, 0)
    if (Math.round(sum * 100) !== Math.round(amt * 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La suma de medios de pago debe ser igual al monto total',
        path: ['operationComponents'],
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

export const operationFiltersSchema = z.object({
  status: z.array(OperationStatusEnum).optional(),
  type: z.array(OperationTypeEnum).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(50),
})

export const updateOperationStatusSchema = z.object({
  id: z.string().uuid(),
  status: OperationStatusEnum,
  reason: z.string().optional(),
})

export type CreateOperationInput = z.infer<typeof createOperationSchema>
export type UpdateOperationInput = z.infer<typeof updateOperationSchema>
export type OperationFilters = z.infer<typeof operationFiltersSchema>
export type UpdateOperationStatusInput = z.infer<typeof updateOperationStatusSchema>
export type OperationType = z.infer<typeof OperationTypeEnum>
export type OperationStatus = z.infer<typeof OperationStatusEnum>
export type OperationMethod = z.infer<typeof OperationMethodEnum>
export type FundOwner = z.infer<typeof FundOwnerEnum>
export type OperationComponentType = z.infer<typeof OperationComponentTypeEnum>
