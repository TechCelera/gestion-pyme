// Export all types from transaction.ts to avoid circular dependencies
export type {
  TransactionType,
  TransactionMethod,
  TransactionStatus,
  ContactType,
  DocumentType,
  AdjustmentReason,
  Transaction,
} from './transaction'

// Import types for use in this file
import type { TransactionType, TransactionMethod } from './transaction'

// Re-export transaction utilities
export {
  VALID_STATUS_TRANSITIONS,
  isValidStatusTransition,
  canEditTransaction,
  canDeleteTransaction,
  isPostedTransaction,
  getRequiredFieldsForType,
  validateTransactionFields,
  isTransactionStatus,
  isTransactionType,
  isTransactionMethod,
  isContactType,
  isDocumentType,
  isAdjustmentReason,
} from './transaction'

export type PeriodStatus = 'open' | 'closed'
export type UserRole = 'superadmin' | 'admin_finanzas' | 'responsable' | 'vendedor'

export interface Company {
  readonly id: string
  readonly name: string
  readonly currency: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: null | Date
}

export interface User {
  readonly id: string
  readonly companyId: string
  readonly email: string
  readonly role: UserRole
  readonly fullName: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface Account {
  readonly id: string
  readonly companyId: string
  readonly name: string
  readonly type: 'cash' | 'bank' | 'other'
  readonly currency: string
  readonly balance: number
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: null | Date
}

export interface Category {
  readonly id: string
  readonly companyId: string
  readonly name: string
  readonly type: 'income' | 'cost' | 'admin_expense' | 'commercial_expense' | 'financial_expense'
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: null | Date
}

// Deprecated: Old Transaction interface kept for backwards compatibility
// Use the new Transaction type from './transaction' instead
export interface LegacyTransaction {
  readonly id: string
  readonly companyId: string
  readonly accountId: string
  readonly categoryId: string
  readonly type: Exclude<TransactionType, 'transfer' | 'adjustment'>
  readonly method: TransactionMethod
  readonly amount: number
  readonly currency: string
  readonly exchangeRate: null | number
  readonly date: Date
  readonly description: string
  readonly createdBy: string
  readonly updatedBy: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: null | Date
  readonly deletedBy: null | string
}

export interface Period {
  readonly id: string
  readonly companyId: string
  readonly year: number
  readonly month: number
  readonly status: PeriodStatus
  readonly closedBy: null | string
  readonly closedAt: null | Date
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface AuditLog {
  readonly id: string
  readonly companyId: string
  readonly tableName: string
  readonly recordId: string
  readonly action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE'
  readonly oldValues: null | Record<string, unknown>
  readonly newValues: null | Record<string, unknown>
  readonly userId: string
  readonly createdAt: Date
}
