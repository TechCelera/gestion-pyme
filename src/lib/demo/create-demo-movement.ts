import type { Movement } from '@/lib/actions/movements'
import type { CreateMovementInput, MovementStatus } from '@/lib/validations/movement'
import { DEFAULT_TRANSFER_DESCRIPTION } from '@/lib/validations/movement'
import { resolveMovementDescription } from '@/lib/movements/form-defaults'
import { DEMO_ACCOUNTS, DEMO_CATEGORIES } from '@/lib/demo-data'

export function createDemoMovementFromInput(
  data: CreateMovementInput,
  status: MovementStatus
): Movement {
  const dateIso =
    data.date instanceof Date ? data.date.toISOString() : new Date(data.date).toISOString()

  const accountId =
    data.type === 'transfer'
      ? (data.sourceAccountId ?? data.accountId ?? '')
      : (data.accountId ?? '')

  const account = DEMO_ACCOUNTS.find((a) => a.id === accountId)
  const category = data.categoryId
    ? DEMO_CATEGORIES.find((c) => c.id === data.categoryId)
    : undefined

  const description =
    data.type === 'transfer' && !data.description.trim()
      ? DEFAULT_TRANSFER_DESCRIPTION
      : resolveMovementDescription({
          type: data.type,
          description: data.description,
          categoryName: category?.name,
        })

  return {
    id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    accountId,
    accountName: account?.name ?? 'Cuenta',
    categoryId: data.categoryId ?? null,
    categoryName: category?.name ?? null,
    type: data.type,
    status,
    method: data.method ?? 'cash',
    amount: data.amount,
    currency: data.currency ?? 'ARS',
    date: dateIso,
    description,
    createdAt: new Date().toISOString(),
    createdBy: 'demo-user-001',
    creatorName: 'Usuario Demo',
    projectId: data.projectId ?? null,
    fundOwner: data.fundOwner ?? 'company',
  }
}
