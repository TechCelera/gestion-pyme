import type {
  MovementComponentRow,
  MovementStatus,
  FundOwner,
  OperationKind,
} from '@/lib/validations/movement'

// Types
export interface Movement {
  id: string
  accountId: string
  accountName: string
  categoryId: string | null
  categoryName: string | null
  type: 'income' | 'expense' | 'transfer' | 'adjustment'
  operationKind: OperationKind | null
  contactId?: string | null
  status: MovementStatus
  method: string
  amount: number
  currency: string
  date: string
  description: string
  createdAt: string
  createdBy: string
  creatorName: string | null
  projectId?: string | null
  projectName?: string | null
  fundOwner?: FundOwner
  requiresBudgetApproval?: boolean
  budgetApprovedBy?: string | null
}

export interface MovementComponentDTO extends MovementComponentRow {
  id?: string
}

/** Detalle ampliado (RPC + campos de workflow / proyecto). */
export interface MovementDetail extends Movement {
  exchangeRate: number
  contactId: string | null
  contactName: string | null
  contactType: string | null
  sourceAccountId: string | null
  sourceAccountName: string | null
  destinationAccountId: string | null
  destinationAccountName: string | null
  adjustmentReason: string | null
  documentType: string | null
  documentNumber: string | null
  attachmentUrl: string | null
  updatedAt: string | null
  approverName: string | null
  approvedAt: string | null
  rejecterName: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  cancellationReason: string | null
  budgetApprovalNote: string | null
}
