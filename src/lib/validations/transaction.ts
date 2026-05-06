import { z } from 'zod'

// Enums
export const TransactionTypeEnum = z.enum(['income', 'expense', 'transfer', 'adjustment'])
export const TransactionStatusEnum = z.enum(['draft', 'pending', 'approved', 'posted', 'rejected'])
export const TransactionMethodEnum = z.enum(['cash', 'transfer', 'card', 'digital', 'other'])
export const ContactTypeEnum = z.enum(['cliente', 'proveedor'])
export const AdjustmentReasonEnum = z.enum(['reconciliation', 'correction', 'other'])
export type AdjustmentReason = z.infer<typeof AdjustmentReasonEnum>
export const DocumentTypeEnum = z.enum(['invoice', 'receipt', 'ticket', 'other'])
export const FundOwnerEnum = z.enum(['company', 'client_advance'])

/** Medios de cobro/pago alineados al motor SQL operation_components */
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

/** Payload snake_case para RPC set_operation_components */
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

// Base schema object (without superRefine)
const baseTransactionSchemaObject = z.object({
  type: TransactionTypeEnum,
  date: z.coerce.date(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currency: z.string().default('ARS'),
  description: z.string()
    .min(3, 'La descripción debe tener al menos 3 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  method: TransactionMethodEnum.default('cash'),
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

// Create Transaction Schema
export const createTransactionSchema = baseTransactionSchemaObject.superRefine((data, ctx) => {
  // Validar campos requeridos según el tipo
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

// Update Transaction Schema - use base object to allow partial()
export const updateTransactionSchema = baseTransactionSchemaObject
  .partial()
  .extend({
    id: z.string().uuid(),
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

// Transaction Filters Schema
export const transactionFiltersSchema = z.object({
  status: z.array(TransactionStatusEnum).optional(),
  type: z.array(TransactionTypeEnum).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(50),
})

// Update Status Schema
export const updateTransactionStatusSchema = z.object({
  id: z.string().uuid(),
  status: TransactionStatusEnum,
  reason: z.string().optional(),
})

// Types
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>
export type UpdateTransactionStatusInput = z.infer<typeof updateTransactionStatusSchema>
export type TransactionType = z.infer<typeof TransactionTypeEnum>
export type TransactionStatus = z.infer<typeof TransactionStatusEnum>
export type TransactionMethod = z.infer<typeof TransactionMethodEnum>
export type FundOwner = z.infer<typeof FundOwnerEnum>
export type OperationComponentType = z.infer<typeof OperationComponentTypeEnum>
