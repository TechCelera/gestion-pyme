import type { MovementStatus, FundOwner } from '@/lib/validations/movement'
import type { Movement, MovementDetail } from './types'

export function mapMovementDetail(
  rpcRow: Record<string, unknown>,
  extra: Record<string, unknown> | null
): MovementDetail {
  const merged: Record<string, unknown> = {
    ...rpcRow,
    project_id: extra?.project_id ?? rpcRow.project_id,
    project_name:
      (extra?.projects as { name?: string } | null)?.name ?? rpcRow.project_name,
    fund_owner: extra?.fund_owner ?? rpcRow.fund_owner,
    requires_budget_approval:
      extra?.requires_budget_approval ?? rpcRow.requires_budget_approval,
    budget_approved_by: extra?.budget_approved_by ?? rpcRow.budget_approved_by,
  }

  const base = mapMovement(merged)

  return {
    ...base,
    exchangeRate: Number(rpcRow.exchange_rate ?? 1),
    contactId: (rpcRow.contact_id as string | null) ?? null,
    contactName: (rpcRow.contact_name as string | null) ?? null,
    contactType: (rpcRow.contact_type as string | null) ?? null,
    sourceAccountId: (rpcRow.source_account_id as string | null) ?? null,
    sourceAccountName: (rpcRow.source_account_name as string | null) ?? null,
    destinationAccountId: (rpcRow.destination_account_id as string | null) ?? null,
    destinationAccountName: (rpcRow.destination_account_name as string | null) ?? null,
    adjustmentReason: (rpcRow.adjustment_reason as string | null) ?? null,
    documentType: (rpcRow.document_type as string | null) ?? null,
    documentNumber: (rpcRow.document_number as string | null) ?? null,
    attachmentUrl: (rpcRow.attachment_url as string | null) ?? null,
    updatedAt: (rpcRow.updated_at as string | null) ?? null,
    approverName: (rpcRow.approver_name as string | null) ?? null,
    approvedAt: (rpcRow.approved_at as string | null) ?? null,
    rejecterName: (rpcRow.rejecter_name as string | null) ?? null,
    rejectedAt: (rpcRow.rejected_at as string | null) ?? null,
    rejectionReason: (rpcRow.rejection_reason as string | null) ?? null,
    cancellationReason: (extra?.cancellation_reason as string | null) ?? null,
    budgetApprovalNote: (extra?.budget_approval_note as string | null) ?? null,
  }
}

/** Mapea fila del RPC `get_transactions` al tipo `Movement` de la app */
export function mapMovement(raw: unknown): Movement {
  const t = raw as Record<string, unknown>
  return {
    id: t.id as string,
    accountId: t.account_id as string,
    accountName: (t.accounts as Record<string, string>)?.name ?? (t.account_name as string) ?? '',
    categoryId: t.category_id as string | null,
    categoryName: (t.categories as Record<string, string>)?.name ?? (t.category_name as string) ?? null,
    type: t.type as 'income' | 'expense' | 'transfer' | 'adjustment',
    status: t.status as MovementStatus,
    method: (t.method as string) || 'cash',
    amount: Number(t.amount),
    currency: t.currency as string,
    date: t.date as string,
    description: t.description as string,
    createdAt: t.created_at as string,
    createdBy: t.created_by as string,
    creatorName: (t.users as Record<string, string>)?.full_name ?? (t.creator_name as string) ?? null,
    projectId: (t.project_id as string) ?? null,
    projectName: (t.projects as Record<string, string>)?.name ?? (t.project_name as string) ?? null,
    fundOwner: ((t.fund_owner as FundOwner) ?? 'company'),
    requiresBudgetApproval: Boolean(t.requires_budget_approval),
    budgetApprovedBy: (t.budget_approved_by as string | null) ?? null,
  }
}
