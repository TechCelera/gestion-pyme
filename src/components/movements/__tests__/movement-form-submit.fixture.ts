import type { MovementFormSubmitInput } from '../movement-form-submit'
import { buildEffectiveComponentLines } from '../movement-form-submit'
import { newComponentLine } from '../movement-form.types'
export const submitFixtureAccounts = [
  { id: 'acc-bank', type: 'bank' as const },
  { id: 'acc-cash', type: 'cash' as const },
]

export function buildSubmitInput(
  overrides: Partial<MovementFormSubmitInput> = {}
): MovementFormSubmitInput {
  const type = overrides.type ?? 'income'
  const operationKind = overrides.operationKind ?? 'collection'
  const amount = overrides.amount ?? '1000'
  const accountId = overrides.accountId ?? 'acc-bank'
  const showPaymentSplit =
    overrides.showPaymentSplit ??
    (type === 'income' || type === 'expense')
  const componentLines =
    overrides.componentLines ??
    (type === 'income' || type === 'expense'
      ? [
          {
            ...newComponentLine(),
            accountId,
            amount,
            componentType: 'operative_bank' as const,
          },
        ]
      : [newComponentLine()])
  const accounts = overrides.accounts ?? submitFixtureAccounts

  const effectiveComponentLines =
    overrides.effectiveComponentLines ??
    buildEffectiveComponentLines({
      type: type === 'transfer' || type === 'adjustment' ? 'income' : type,
      operationKind,
      showPaymentSplit,
      componentLines,
      accountId,
      amount,
      accounts,
    })

  return {
    type,
    operationKind,
    movementScope: 'general',
    date: '2026-05-20',
    amount,
    currency: 'ARS',
    description: '',
    method: 'cash',
    accountId,
    categoryId: '',
    contactId: 'contact-1',
    sourceAccountId: '',
    destinationAccountId: '',
    adjustmentReason: '',
    fundOwner: 'company',
    projectId: '',
    showPaymentSplit,
    componentLines,
    effectiveComponentLines,
    accounts,
    categories: [{ id: 'cat-1', name: 'Ventas' }],
    contacts: [{ id: 'contact-1', name: 'Cliente Demo' }],
    cashDateContext: null,
    ...overrides,
  }
}
