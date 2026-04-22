/**
 * Transaction entity for the domain layer
 * Extended to support workflow states (draft → pending → approved → posted)
 * and multiple transaction types (income, expense, transfer, adjustment)
 */

// Basic type definitions (defined here to avoid circular imports)
export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment'
export type TransactionMethod = 'accrual' | 'cash'
export type TransactionStatus = 'draft' | 'pending' | 'approved' | 'posted' | 'rejected'
export type ContactType = 'cliente' | 'proveedor'
export type DocumentType = 'invoice' | 'receipt' | 'ticket' | 'other'
export type AdjustmentReason = 'reconciliation' | 'correction' | 'other'

/**
 * Transaction entity representing a financial transaction in the system.
 * All fields are readonly to ensure immutability.
 */
export interface Transaction {
  /** Unique identifier */
  readonly id: string
  /** Company this transaction belongs to */
  readonly companyId: string
  /** Account where this transaction is recorded */
  readonly accountId: string
  /** Category for categorization (null for transfers) */
  readonly categoryId: string | null
  /** Type of transaction: income, expense, transfer, or adjustment */
  readonly type: TransactionType
  /** Accounting method: accrual or cash */
  readonly method: TransactionMethod
  /** Current status in the approval workflow */
  readonly status: TransactionStatus
  /** Transaction amount */
  readonly amount: number
  /** Currency code (e.g., 'USD', 'COP') */
  readonly currency: string
  /** Exchange rate if currency differs from company default */
  readonly exchangeRate: number | null
  /** Transaction date */
  readonly date: Date
  /** Description of the transaction */
  readonly description: string

  // Contact fields for income/expense transactions
  /** Contact ID (client or provider) */
  readonly contactId: string | null
  /** Type of contact: client or provider */
  readonly contactType: ContactType | null

  // Transfer fields
  /** Source account for transfers */
  readonly sourceAccountId: string | null
  /** Destination account for transfers */
  readonly destinationAccountId: string | null

  // Adjustment fields
  /** Reason for the adjustment */
  readonly adjustmentReason: AdjustmentReason | null

  // Document fields
  /** Type of supporting document */
  readonly documentType: DocumentType | null
  /** Document number (invoice, receipt, etc.) */
  readonly documentNumber: string | null
  /** URL to attached document file */
  readonly attachmentUrl: string | null

  // Metadata
  /** User who created the transaction */
  readonly createdBy: string
  /** User who last updated the transaction */
  readonly updatedBy: string
  /** User who approved the transaction */
  readonly approvedBy: string | null
  /** When the transaction was approved */
  readonly approvedAt: Date | null
  /** User who posted the transaction */
  readonly postedBy: string | null
  /** When the transaction was posted */
  readonly postedAt: Date | null
  /** User who rejected the transaction */
  readonly rejectedBy: string | null
  /** When the transaction was rejected */
  readonly rejectedAt: Date | null
  /** Reason for rejection */
  readonly rejectionReason: string | null

  // Timestamps
  /** When the transaction was created */
  readonly createdAt: Date
  /** When the transaction was last updated */
  readonly updatedAt: Date
  /** When the transaction was soft deleted (null if not deleted) */
  readonly deletedAt: Date | null
  /** User who soft deleted the transaction */
  readonly deletedBy: string | null
}

/**
 * Valid transitions between transaction statuses
 * Defines the state machine for transaction workflow
 * Note: 'deleted' is an action (soft delete), not a status
 * Note: 'reversed' creates a new reversing transaction, not a status change
 */
export const VALID_STATUS_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  draft: ['pending'],
  pending: ['approved', 'rejected'],
  approved: ['posted', 'draft'],
  posted: [], // Posted transactions cannot change status (immutable)
  rejected: ['draft', 'pending'],
}

/**
 * Check if a status transition is valid
 * @param from - Current status
 * @param to - Target status
 * @returns boolean indicating if the transition is allowed
 */
export function isValidStatusTransition(from: TransactionStatus, to: TransactionStatus): boolean {
  if (from === to) return true
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Check if a transaction can be edited
 * Only DRAFT transactions can be edited
 * @param status - Current transaction status
 * @returns boolean indicating if the transaction can be edited
 */
export function canEditTransaction(status: TransactionStatus): boolean {
  return status === 'draft'
}

/**
 * Check if a transaction can be deleted (soft delete)
 * Only DRAFT and REJECTED transactions can be deleted
 * @param status - Current transaction status
 * @returns boolean indicating if the transaction can be deleted
 */
export function canDeleteTransaction(status: TransactionStatus): boolean {
  return status === 'draft' || status === 'rejected'
}

/**
 * Check if a transaction is posted (immutable)
 * Posted transactions cannot be modified
 * @param status - Current transaction status
 * @returns boolean indicating if the transaction is posted
 */
export function isPostedTransaction(status: TransactionStatus): boolean {
  return status === 'posted'
}

/**
 * Get required fields based on transaction type
 * @param type - Transaction type
 * @returns Array of required field names
 */
export function getRequiredFieldsForType(type: TransactionType): string[] {
  const baseFields = ['date', 'amount', 'description']

  switch (type) {
    case 'income':
    case 'expense':
      return [...baseFields, 'accountId', 'categoryId']
    case 'transfer':
      return [...baseFields, 'sourceAccountId', 'destinationAccountId']
    case 'adjustment':
      return [...baseFields, 'accountId', 'adjustmentReason']
    default:
      return baseFields
  }
}

/**
 * Validate that a transaction has all required fields for its type
 * @param transaction - Transaction to validate
 * @returns Validation result with isValid flag and optional error message
 */
export function validateTransactionFields(
  transaction: Partial<Transaction>
): { isValid: boolean; error?: string } {
  if (!transaction.type) {
    return { isValid: false, error: 'Transaction type is required' }
  }

  const requiredFields = getRequiredFieldsForType(transaction.type)
  const missingFields: string[] = []

  for (const field of requiredFields) {
    const value = transaction[field as keyof Partial<Transaction>]
    if (value === undefined || value === null || value === '') {
      missingFields.push(field)
    }
  }

  // Special validation for transfers: source and destination must be different
  if (transaction.type === 'transfer') {
    if (
      transaction.sourceAccountId &&
      transaction.destinationAccountId &&
      transaction.sourceAccountId === transaction.destinationAccountId
    ) {
      return {
        isValid: false,
        error: 'Source and destination accounts must be different',
      }
    }
  }

  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields for ${transaction.type}: ${missingFields.join(', ')}`,
    }
  }

  return { isValid: true }
}

/**
 * Type guard to check if a value is a valid TransactionStatus
 * @param value - Value to check
 * @returns boolean
 */
export function isTransactionStatus(value: unknown): value is TransactionStatus {
  return typeof value === 'string' && ['draft', 'pending', 'approved', 'posted', 'rejected'].includes(value)
}

/**
 * Type guard to check if a value is a valid TransactionType
 * @param value - Value to check
 * @returns boolean
 */
export function isTransactionType(value: unknown): value is TransactionType {
  return typeof value === 'string' && ['income', 'expense', 'transfer', 'adjustment'].includes(value)
}

/**
 * Type guard to check if a value is a valid TransactionMethod
 * @param value - Value to check
 * @returns boolean
 */
export function isTransactionMethod(value: unknown): value is TransactionMethod {
  return typeof value === 'string' && ['accrual', 'cash'].includes(value)
}

/**
 * Type guard to check if a value is a valid ContactType
 * @param value - Value to check
 * @returns boolean
 */
export function isContactType(value: unknown): value is ContactType {
  return typeof value === 'string' && ['cliente', 'proveedor'].includes(value)
}

/**
 * Type guard to check if a value is a valid DocumentType
 * @param value - Value to check
 * @returns boolean
 */
export function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === 'string' && ['invoice', 'receipt', 'ticket', 'other'].includes(value)
}

/**
 * Type guard to check if a value is a valid AdjustmentReason
 * @param value - Value to check
 * @returns boolean
 */
export function isAdjustmentReason(value: unknown): value is AdjustmentReason {
  return typeof value === 'string' && ['reconciliation', 'correction', 'other'].includes(value)
}
