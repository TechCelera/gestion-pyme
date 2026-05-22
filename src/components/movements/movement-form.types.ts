import type { Account } from '@/lib/actions/accounts'
import type { MovementComponentType } from '@/lib/validations/movement'
import { defaultComponentTypeForAccount } from '@/lib/movements/form-defaults'
import { moneyInputToNumber } from '@/lib/utils/money-input'

/** Target para crear contacto desde el select principal (cobro/pago guiado). */
export const GUIDED_MAIN_CONTACT_LINE_ID = '__guided-main__'

/** IDs estables para E2E y accesibilidad en formulario guiado. */
export const MOVEMENT_GUIDED_FIELD_IDS = {
  amount: 'amount-guided',
  currency: 'currency-guided',
  date: 'date-guided',
  contact: 'contact-guided',
  account: 'account-guided',
  cashAccount: 'cash-account-guided',
  category: 'category-guided',
  description: 'description-guided',
  paymentModeSingle: 'payment-mode-single',
  paymentModeSplit: 'payment-mode-split',
} as const

export type ComponentLineDraft = {
  localId: string
  componentType: MovementComponentType
  accountId: string
  contactId: string
  amount: string
}

export function newComponentLine(partial?: Partial<ComponentLineDraft>): ComponentLineDraft {
  return {
    localId: partial?.localId ?? crypto.randomUUID(),
    componentType: partial?.componentType ?? 'operative_cash',
    accountId: partial?.accountId ?? '',
    contactId: partial?.contactId ?? '',
    amount: partial?.amount ?? '',
  }
}

export const INCOME_COMPONENT_TYPES: { value: MovementComponentType; label: string }[] = [
  { value: 'operative_cash', label: 'Efectivo (caja)' },
  { value: 'operative_bank', label: 'Banco / cuenta' },
  { value: 'client_receivable', label: 'Cliente (cuenta corriente)' },
]

export const EXPENSE_COMPONENT_TYPES: { value: MovementComponentType; label: string }[] = [
  { value: 'operative_cash', label: 'Efectivo (caja)' },
  { value: 'operative_bank', label: 'Banco / cuenta' },
  { value: 'supplier_payable', label: 'Proveedor (cuenta corriente)' },
]

const COLLECTION_PAYMENT_COMPONENT_TYPES: { value: MovementComponentType; label: string }[] = [
  { value: 'operative_cash', label: 'Efectivo (caja)' },
  { value: 'operative_bank', label: 'Banco / cuenta' },
]

export function componentTypesForMovement(
  type: 'income' | 'expense',
  operationKind?: 'sale' | 'purchase' | 'collection' | 'payment' | null
) {
  if (operationKind === 'collection' || operationKind === 'payment') {
    return COLLECTION_PAYMENT_COMPONENT_TYPES
  }
  return type === 'income' ? INCOME_COMPONENT_TYPES : EXPENSE_COMPONENT_TYPES
}

export function lineAmountToNumber(amount: string): number {
  return moneyInputToNumber(amount)
}

/** Una línea operativa a partir de la cuenta y monto principal (pago en un solo medio). */
export function buildMainComponentLine(
  accountId: string,
  amount: string,
  accounts: Pick<Account, 'id' | 'type'>[]
): ComponentLineDraft {
  const account = accounts.find((a) => a.id === accountId)
  return newComponentLine({
    componentType: defaultComponentTypeForAccount(account?.type),
    accountId,
    amount,
  })
}

/** Al elegir cuenta en split simple, infiere tipo operativo (caja vs banco). */
export function withAccountComponentType(
  line: ComponentLineDraft,
  accountId: string,
  accounts: Pick<Account, 'id' | 'type'>[]
): ComponentLineDraft {
  const account = accounts.find((a) => a.id === accountId)
  return {
    ...line,
    accountId,
    contactId: '',
    componentType: defaultComponentTypeForAccount(account?.type),
  }
}

export function splitRemainderAmount(
  componentLines: ComponentLineDraft[],
  totalAmount: string,
  excludeLocalId?: string
): number | null {
  const parsedTotal = lineAmountToNumber(totalAmount)
  if (Number.isNaN(parsedTotal)) return null
  const sum = componentLines.reduce((acc, line) => {
    if (excludeLocalId && line.localId === excludeLocalId) return acc
    const v = lineAmountToNumber(line.amount)
    return acc + (Number.isNaN(v) ? 0 : v)
  }, 0)
  const remainder = parsedTotal - sum
  return Math.round(remainder * 100) / 100
}

export function componentsSumMatchesTotal(
  componentLines: ComponentLineDraft[],
  totalAmount: string
): boolean {
  const parsedTotal = lineAmountToNumber(totalAmount)
  if (Number.isNaN(parsedTotal)) return false
  const sum = componentLines.reduce((acc, line) => {
    const v = lineAmountToNumber(line.amount)
    return acc + (Number.isNaN(v) ? 0 : v)
  }, 0)
  return Math.round(sum * 100) === Math.round(parsedTotal * 100)
}
