/**
 * Use case for updating an existing transaction
 * Only DRAFT transactions can be updated
 */

import type { TransactionRepository, PeriodRepository, AuditLogRepository } from '../repositories'
import {
  ValidationError,
  PeriodClosedError,
  TransactionNotFoundError,
  PostedImmutableError,
  NotAuthorizedError,
} from '../errors'
import {
  canEditTransaction,
  type Transaction,
  type TransactionMethod,
  type ContactType,
  type DocumentType,
  type AdjustmentReason,
} from '../entities/transaction'

export interface UpdateTransactionInput {
  readonly transactionId: string
  readonly accountId?: string
  readonly categoryId?: string
  readonly method?: TransactionMethod
  readonly amount?: number
  readonly currency?: string
  readonly exchangeRate?: number
  readonly date?: Date
  readonly description?: string
  readonly updatedBy: string
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
 * Result type for update transaction operation
 */
export type UpdateTransactionResult =
  | { success: true; transaction: Transaction }
  | { success: false; error: string }

/**
 * Update an existing transaction
 * Only DRAFT transactions can be updated
 * @param input - Update data
 * @param transactionRepo - Repository for transactions
 * @param periodRepo - Repository for periods
 * @param auditRepo - Repository for audit logs
 * @returns Result with updated transaction or error
 */
export async function updateTransaction(
  input: UpdateTransactionInput,
  transactionRepo: TransactionRepository,
  periodRepo: PeriodRepository,
  auditRepo: AuditLogRepository
): Promise<UpdateTransactionResult> {
  try {
    // Find existing transaction
    const existingTransaction = await transactionRepo.findById(input.transactionId)

    if (!existingTransaction) {
      throw new TransactionNotFoundError(input.transactionId)
    }

    // Check if transaction is deleted
    if (existingTransaction.deletedAt) {
      throw new NotAuthorizedError('Cannot update a deleted transaction')
    }

    // Check if transaction can be edited (only DRAFT)
    if (!canEditTransaction(existingTransaction.status)) {
      throw new PostedImmutableError()
    }

    // Check permissions - only creator or admin can edit
    const isCreator = existingTransaction.createdBy === input.updatedBy
    const isAdmin = ['superadmin', 'admin_finanzas'].includes(input.userRole)

    if (!isCreator && !isAdmin) {
      throw new NotAuthorizedError('Only the creator or admins can edit this transaction')
    }

    // Check if new date is in a closed period (if date is being changed)
    if (input.date && input.date.getTime() !== existingTransaction.date.getTime()) {
      const period = await periodRepo.findByCompanyAndMonth(
        existingTransaction.companyId,
        input.date.getFullYear(),
        input.date.getMonth() + 1
      )
      if (period && period.status === 'closed') {
        throw new PeriodClosedError(period.year, period.month)
      }
    }

    // Validate amount if provided
    if (input.amount !== undefined && input.amount <= 0) {
      throw new ValidationError('Amount must be greater than zero')
    }

    // Validate transfer accounts if provided
    if (existingTransaction.type === 'transfer') {
      const sourceId = input.sourceAccountId ?? existingTransaction.sourceAccountId
      const destId = input.destinationAccountId ?? existingTransaction.destinationAccountId

      if (sourceId && destId && sourceId === destId) {
        throw new ValidationError('Source and destination accounts must be different')
      }
    }

    // Build update data (only allowed fields)
    // Use type assertion to bypass readonly restrictions for updates
    const updateData: Partial<Record<keyof Transaction, unknown>> = {
      updatedBy: input.updatedBy,
      updatedAt: new Date(),
    }

    // Apply allowed field updates
    if (input.accountId !== undefined) updateData.accountId = input.accountId
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId
    if (input.method !== undefined) updateData.method = input.method
    if (input.amount !== undefined) updateData.amount = input.amount
    if (input.currency !== undefined) updateData.currency = input.currency
    if (input.exchangeRate !== undefined) updateData.exchangeRate = input.exchangeRate
    if (input.date !== undefined) updateData.date = input.date
    if (input.description !== undefined) updateData.description = input.description
    if (input.contactId !== undefined) updateData.contactId = input.contactId
    if (input.contactType !== undefined) updateData.contactType = input.contactType
    if (input.sourceAccountId !== undefined) updateData.sourceAccountId = input.sourceAccountId
    if (input.destinationAccountId !== undefined) updateData.destinationAccountId = input.destinationAccountId
    if (input.adjustmentReason !== undefined) updateData.adjustmentReason = input.adjustmentReason
    if (input.documentType !== undefined) updateData.documentType = input.documentType
    if (input.documentNumber !== undefined) updateData.documentNumber = input.documentNumber
    if (input.attachmentUrl !== undefined) updateData.attachmentUrl = input.attachmentUrl

    const updated = await transactionRepo.update(input.transactionId, updateData as Partial<Transaction>)

    // Audit log
    await auditRepo.save({
      id: crypto.randomUUID(),
      companyId: existingTransaction.companyId,
      tableName: 'transactions',
      recordId: updated.id,
      action: 'UPDATE',
      oldValues: existingTransaction,
      newValues: updated,
      userId: input.updatedBy,
      createdAt: new Date(),
    })

    return { success: true, transaction: updated }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Unknown error occurred' }
  }
}
