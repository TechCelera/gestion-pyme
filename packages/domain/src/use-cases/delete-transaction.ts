/**
 * Use case for deleting (soft delete) a transaction
 * Only DRAFT transactions can be deleted
 */

import type { TransactionRepository, AuditLogRepository } from '../repositories'
import {
  TransactionNotFoundError,
  NotAuthorizedError,
} from '../errors'
import { canDeleteTransaction, type TransactionStatus } from '../entities/transaction'

export interface DeleteTransactionInput {
  readonly transactionId: string
  readonly userId: string
  readonly userRole: string
}

/**
 * Result type for delete transaction operation
 */
export type DeleteTransactionResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Delete (soft delete) a transaction
 * Only DRAFT transactions can be deleted
 * Only the creator or admins can delete
 * @param input - Delete data
 * @param transactionRepo - Repository for transactions
 * @param auditRepo - Repository for audit logs
 * @returns Result indicating success or error
 */
export async function deleteTransaction(
  input: DeleteTransactionInput,
  transactionRepo: TransactionRepository,
  auditRepo: AuditLogRepository
): Promise<DeleteTransactionResult> {
  try {
    // Find existing transaction
    const existingTransaction = await transactionRepo.findById(input.transactionId)

    if (!existingTransaction) {
      throw new TransactionNotFoundError(input.transactionId)
    }

    // Check if already deleted
    if (existingTransaction.deletedAt) {
      return { success: true } // Idempotent
    }

    // Check if transaction can be deleted (only DRAFT)
    if (!canDeleteTransaction(existingTransaction.status)) {
      throw new NotAuthorizedError(`Cannot delete transaction in ${existingTransaction.status} status. Only DRAFT transactions can be deleted.`)
    }

    // Check permissions - only creator or admin can delete
    const isCreator = existingTransaction.createdBy === input.userId
    const isAdmin = ['superadmin', 'admin_finanzas'].includes(input.userRole)

    if (!isCreator && !isAdmin) {
      throw new NotAuthorizedError('Only the creator or admins can delete this transaction')
    }

    // Perform soft delete
    await transactionRepo.delete(input.transactionId, input.userId)

    // Audit log
    await auditRepo.save({
      id: crypto.randomUUID(),
      companyId: existingTransaction.companyId,
      tableName: 'transactions',
      recordId: input.transactionId,
      action: 'DELETE',
      oldValues: existingTransaction,
      newValues: null,
      userId: input.userId,
      createdAt: new Date(),
    })

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Unknown error occurred' }
  }
}
