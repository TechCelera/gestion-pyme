import { z } from 'zod'

// Enums
export const TransactionTypeEnum = z.enum(['income', 'expense', 'transfer', 'adjustment'])
export const TransactionStatusEnum = z.enum(['draft', 'pending', 'approved', 'posted', 'rejected'])
export const TransactionMethodEnum = z.enum(['accrual', 'cash'])
export const ContactTypeEnum = z.enum(['cliente', 'proveedor'])
export const AdjustmentReasonEnum = z.enum(['reconciliation', 'correction', 'other'])
export const DocumentTypeEnum = z.enum(['invoice', 'receipt', 'ticket', 'other'])

// Base schema object (without superRefine)
const baseTransactionSchemaObject = z.object({
  type: TransactionTypeEnum,
  date: z.coerce.date(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currency: z.string().default('USD'),
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
})

// Update Transaction Schema - use base object to allow partial()
export const updateTransactionSchema = baseTransactionSchemaObject.partial().extend({
  id: z.string().uuid(),
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
