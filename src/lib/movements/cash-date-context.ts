import type { MovementScope } from '@/lib/movements/cash-date-policy'
import {
  cashDateBoundsForGeneralScope,
  isDateAllowedForCashInGeneral,
  movementHasCashComponent,
  type AccountTypeHint,
  type CashComponentInput,
} from '@/lib/movements/cash-date-policy'

export type CashDateContextInput = {
  movementScope: MovementScope
  showPaymentSplit: boolean
  componentLines: CashComponentInput[]
  accountId?: string
  accounts: AccountTypeHint[]
  date: string
}

export function buildCashDateContext(input: CashDateContextInput) {
  const hasCash = movementHasCashComponent({
    showPaymentSplit: input.showPaymentSplit,
    componentLines: input.componentLines,
    accountId: input.accountId,
    accounts: input.accounts,
  })
  const bounds = cashDateBoundsForGeneralScope(input.movementScope, hasCash)
  const isAllowed = isDateAllowedForCashInGeneral(
    input.date,
    input.movementScope,
    hasCash
  )

  return { hasCash, bounds, isAllowed }
}

export function clampDateToBounds(
  date: string,
  bounds: { min: string; max: string } | null
): string {
  if (!bounds) return date
  if (date < bounds.min || date > bounds.max) return bounds.max
  return date
}
