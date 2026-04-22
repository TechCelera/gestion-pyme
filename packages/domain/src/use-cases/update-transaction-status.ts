/**
 * Use case for updating transaction status
 * Implements state machine for transaction workflow
 */

import type { TransactionRepository, AuditLogRepository } from '../repositories'
import {
  TransactionNotFoundError,
  InvalidTransitionError,
  NotAuthorizedError,
  MissingRejectionReasonError,
} from '../errors'
import { isValidStatusTransition, type Transaction, type TransactionStatus } from '../entities/transaction'

export interface UpdateTransactionStatusInput {
  readonly transactionId: string
  readonly newStatus: TransactionStatus
  readonly userId: string
  readonly userRole: string
  readonly reason?: string // Required for rejection
}

/**
 * Result type for update status operation
 */
export type UpdateTransactionStatusResult =
  | { success: true; transaction: Transaction }
  | { success: false; error: string }

/**
 * Valid transitions that require admin role
 */
const ADMIN_ONLY_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  draft: [],
  pending: ['approved', 'rejected'],
  approved: ['posted', 'draft'],
  posted: [],
  rejected: ['draft', 'pending'],
}

/**
 * Check if user has permission for the transition
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @param userRole - User's role
 * @param isCreator - Whether user is the creator
 * @returns boolean
 */
function hasTransitionPermission(
  fromStatus: TransactionStatus,
  toStatus: TransactionStatus,
  userRole: string,
  isCreator: boolean
): boolean {
  // Admin roles can do admin transitions
  const isAdmin = ['superadmin', 'admin_finanzas'].includes(userRole)

  // Check if this is an admin-only transition
  const requiresAdmin = ADMIN_ONLY_TRANSITIONS[fromStatus]?.includes(toStatus)

  if (requiresAdmin) {
    return isAdmin
  }

  // Non-admin transitions (like draft to pending) can be done by creator
  if (fromStatus === 'draft' && toStatus === 'pending') {
    return isCreator || isAdmin
  }

  // Rejected to draft/pending can be done by creator
  if (fromStatus === 'rejected' && ['draft', 'pending'].includes(toStatus)) {
    return isCreator || isAdmin
  }

  return true
}

/**
 * Update transaction status with state machine validation
 * @param input - Status update data
 * @param transactionRepo - Repository for transactions
 * @param auditRepo - Repository for audit logs
 * @returns Result with updated transaction or error
 */
export async function updateTransactionStatus(
  input: UpdateTransactionStatusInput,
  transactionRepo: TransactionRepository,
  auditRepo: AuditLogRepository
): Promise<UpdateTransactionStatusResult> {
  try {
    // Find existing transaction
    const existingTransaction = await transactionRepo.findById(input.transactionId)

    if (!existingTransaction) {
      throw new TransactionNotFoundError(input.transactionId)
    }

    // Check if transaction is deleted
    if (existingTransaction.deletedAt) {
      throw new NotAuthorizedError('Cannot update status of a deleted transaction')
    }

    // Validate status transition
    const currentStatus = existingTransaction.status
    const newStatus = input.newStatus

    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new InvalidTransitionError(currentStatus, newStatus)
    }

    // Check permissions
    const isCreator = existingTransaction.createdBy === input.userId
    if (!hasTransitionPermission(currentStatus, newStatus, input.userRole, isCreator)) {
      throw new NotAuthorizedError(`Not authorized to transition from ${currentStatus} to ${newStatus}`)
    }

    // Special validation for rejection - reason is required
    if (newStatus === 'rejected' && !input.reason) {
      throw new MissingRejectionReasonError()
    }

    // Special validation for posting - only admin can post
    if (newStatus === 'posted' && !['superadmin', 'admin_finanzas'].includes(input.userRole)) {
      throw new NotAuthorizedError('Only admins can post transactions')
    }

    // Update status with metadata
    const updated = await transactionRepo.updateStatus(
      input.transactionId,
      newStatus,
      input.userId,
      input.reason
    )

    // Audit log
    await auditRepo.save({
      id: crypto.randomUUID(),
      companyId: existingTransaction.companyId,
      tableName: 'transactions',
      recordId: updated.id,
      action: 'UPDATE',
      oldValues: { status: currentStatus },
      newValues: { status: newStatus },
      userId: input.userId,
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

/**
 * Submit a transaction for approval (DRAFT -> PENDING)
 */
export async function submitForApproval(
  transactionId: string,
  userId: string,
  userRole: string,
  transactionRepo: TransactionRepository,
  auditRepo: AuditLogRepository
): Promise<UpdateTransactionStatusResult> {
  return updateTransactionStatus(
    { transactionId, newStatus: 'pending', userId, userRole },
    transactionRepo,
    auditRepo
  )
}

/**
 * Approve a transaction (PENDING -> APPROVED)
 */
export async function approveTransaction(
  transactionId: string,
  userId: string,
  userRole: string,
  transactionRepo: TransactionRepository,
  auditRepo: AuditLogRepository
): Promise<UpdateTransactionStatusResult> {
  return updateTransactionStatus(
    { transactionId, newStatus: 'approved', userId, userRole },
    transactionRepo,
    auditRepo
  )
}

/**
 * Reject a transaction (PENDING -> REJECTED)
 */
export async function rejectTransaction(
  transactionId: string,
  reason: string,
  userId: string,
  userRole: string,
  transactionRepo: TransactionRepository,
  auditRepo: AuditLogRepository
): Promise<UpdateTransactionStatusResult> {
  return updateTransactionStatus(
    { transactionId, newStatus: 'rejected', userId, userRole, reason },
    transactionRepo,
    auditRepo
  )
}

/**
 * Post a transaction (APPROVED -> POSTED)
 */
export async function postTransaction(
  transactionId: string,
  userId: string,
  userRole: string,
  transactionRepo: TransactionRepository,
  auditRepo: AuditLogRepository
): Promise<UpdateTransactionStatusResult> {
  return updateTransactionStatus(
    { transactionId, newStatus: 'posted', userId, userRole },
    transactionRepo,
    auditRepo
  )
}

/**
 * Return transaction to draft (APPROVED -> DRAFT)
 */
export async function returnToDraft(
  transactionId: string,
  userId: string,
  userRole: string,
  transactionRepo: TransactionRepository,
  auditRepo: AuditLogRepository
): Promise<UpdateTransactionStatusResult> {
  return updateTransactionStatus(
    { transactionId, newStatus: 'draft', userId, userRole },
    transactionRepo,
    auditRepo
  )
}
