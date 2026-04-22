import type { TransactionRepository, PeriodRepository, AuditLogRepository } from '../repositories'
import { ClosedPeriodError, ValidationError, PeriodClosedError, NotAuthorizedError } from '../errors'
import {
  validateTransactionFields,
  type Transaction,
  type TransactionType,
  type TransactionMethod,
  type ContactType,
  type DocumentType,
  type AdjustmentReason,
} from '../entities/transaction'

export interface CreateTransactionInput {
  readonly companyId: string
  readonly accountId?: string
  readonly categoryId?: string
  readonly type: TransactionType
  readonly method: TransactionMethod
  readonly amount: number
  readonly currency: string
  readonly exchangeRate?: number
  readonly date: Date
  readonly description: string
  readonly createdBy: string
  readonly userRole: string

  // Contact fields for income/expense
  readonly contactId?: string
  readonly contactType?: ContactType

  // Transfer fields
  readonly sourceAccountId?: string
  readonly destinationAccountId?: string

  // Adjustment fields
  readonly adjustmentReason?: AdjustmentReason

  // Document fields
  readonly documentType?: DocumentType
  readonly documentNumber?: string
  readonly attachmentUrl?: string
}

/**
 * Result type for create transaction operation
 */
export type CreateTransactionResult =
  | { success: true; transaction: Transaction }
  | { success: false; error: string }

/**
 * Create a new transaction with validation
 * @param input - Transaction data
 * @param transactionRepo - Repository for transactions
 * @param periodRepo - Repository for periods
 * @param auditRepo - Repository for audit logs
 * @returns Result with created transaction or error
 */
export async function createTransaction(
  input: CreateTransactionInput,
  transactionRepo: TransactionRepository,
  periodRepo: PeriodRepository,
  auditRepo: AuditLogRepository
): Promise<CreateTransactionResult> {
  try {
    // Validate permissions based on role
    if (input.userRole === 'vendedor' && input.type !== 'income') {
      throw new NotAuthorizedError('Vendedores solo pueden crear transacciones de tipo ingreso')
    }

    // Validate amount is positive
    if (input.amount <= 0) {
      throw new ValidationError('Amount must be greater than zero')
    }

    // Validate date is not more than 1 year in the future
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    if (input.date > oneYearFromNow) {
      throw new ValidationError('Transaction date cannot be more than 1 year in the future')
    }

    // Check period is open
    const period = await periodRepo.findByCompanyAndMonth(
      input.companyId,
      input.date.getFullYear(),
      input.date.getMonth() + 1
    )
    if (period && period.status === 'closed') {
      throw new PeriodClosedError(period.year, period.month)
    }

    // Build transaction object based on type
    const id = crypto.randomUUID()
    const now = new Date()

    // Determine account based on type
    let accountId: string
    let categoryId: string | null = null
    let sourceAccountId: string | null = null
    let destinationAccountId: string | null = null

    switch (input.type) {
      case 'income':
      case 'expense':
      case 'adjustment':
        if (!input.accountId) {
          throw new ValidationError(`Account is required for ${input.type} transactions`)
        }
        accountId = input.accountId
        categoryId = input.categoryId ?? null
        break
      case 'transfer':
        if (!input.sourceAccountId || !input.destinationAccountId) {
          throw new ValidationError('Transfer transactions require source and destination accounts')
        }
        if (input.sourceAccountId === input.destinationAccountId) {
          throw new ValidationError('Source and destination accounts must be different')
        }
        accountId = input.sourceAccountId
        sourceAccountId = input.sourceAccountId
        destinationAccountId = input.destinationAccountId
        break
      default:
        throw new ValidationError(`Invalid transaction type: ${input.type}`)
    }

    const transaction: Transaction = {
      id,
      companyId: input.companyId,
      accountId,
      categoryId,
      type: input.type,
      method: input.method,
      status: 'draft',
      amount: input.amount,
      currency: input.currency,
      exchangeRate: input.exchangeRate ?? null,
      date: input.date,
      description: input.description,
      contactId: input.contactId ?? null,
      contactType: input.contactType ?? null,
      sourceAccountId,
      destinationAccountId,
      adjustmentReason: input.adjustmentReason ?? null,
      documentType: input.documentType ?? null,
      documentNumber: input.documentNumber ?? null,
      attachmentUrl: input.attachmentUrl ?? null,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      approvedBy: null,
      approvedAt: null,
      postedBy: null,
      postedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      deletedBy: null,
    }

    // Validate required fields for the transaction type
    const validation = validateTransactionFields(transaction)
    if (!validation.isValid) {
      throw new ValidationError(validation.error || 'Invalid transaction data')
    }

    const saved = await transactionRepo.create(transaction)

    // Audit log
    await auditRepo.save({
      id: crypto.randomUUID(),
      companyId: input.companyId,
      tableName: 'transactions',
      recordId: saved.id,
      action: 'INSERT',
      oldValues: null,
      newValues: saved,
      userId: input.createdBy,
      createdAt: now,
    })

    return { success: true, transaction: saved }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Unknown error occurred' }
  }
}