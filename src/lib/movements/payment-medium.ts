import type { Account } from '@/lib/actions/accounts'
import {
  type ComponentLineDraft,
  lineAmountToNumber,
  newComponentLine,
  withAccountComponentType,
} from '@/components/movements/movement-form.types'
import {
  formatMoneyInputFromCanonical,
  getMoneyFractionDigits,
} from '@/lib/utils/money-input'
import type { MovementComponentType, OperationKind } from '@/lib/validations/movement'

export type PaymentMediumKey = 'cash' | 'transfer' | 'credit'

export type PaymentMediumOption = {
  key: PaymentMediumKey
  componentType: MovementComponentType
  label: string
}

export function paymentMediumOptions(
  movementType: 'income' | 'expense'
): PaymentMediumOption[] {
  if (movementType === 'income') {
    return [
      { key: 'cash', componentType: 'operative_cash', label: 'Efectivo' },
      { key: 'transfer', componentType: 'operative_bank', label: 'Transferencia' },
      {
        key: 'credit',
        componentType: 'client_receivable',
        label: 'Cuenta corriente (cliente debe)',
      },
    ]
  }
  return [
    { key: 'cash', componentType: 'operative_cash', label: 'Efectivo' },
    { key: 'transfer', componentType: 'operative_bank', label: 'Transferencia' },
    {
      key: 'credit',
      componentType: 'supplier_payable',
      label: 'Cuenta corriente (DEBE)',
    },
  ]
}

export function isOperativeMedium(type: MovementComponentType): boolean {
  return type === 'operative_cash' || type === 'operative_bank'
}

export function isCreditMedium(
  type: MovementComponentType,
  movementType: 'income' | 'expense'
): boolean {
  return movementType === 'income'
    ? type === 'client_receivable'
    : type === 'supplier_payable'
}

export function partitionAccounts(accounts: Account[]) {
  return {
    cash: accounts.filter((a) => a.type === 'cash'),
    bank: accounts.filter((a) => a.type === 'bank'),
  }
}

export function accountsForMedium(
  medium: MovementComponentType,
  accounts: Account[]
): Account[] {
  const { cash, bank } = partitionAccounts(accounts)
  if (medium === 'operative_cash') return cash
  if (medium === 'operative_bank') return bank
  return []
}

export function applyMediumChange(
  line: ComponentLineDraft,
  componentType: MovementComponentType
): ComponentLineDraft {
  const operative = isOperativeMedium(componentType)
  return {
    ...line,
    componentType,
    accountId: operative ? line.accountId : '',
    contactId: operative ? '' : line.contactId,
  }
}

export function normalizeFriendlyPaymentLines(
  lines: ComponentLineDraft[],
  accounts: Pick<Account, 'id' | 'type'>[]
): ComponentLineDraft[] {
  return lines.map((line) =>
    line.accountId && isOperativeMedium(line.componentType)
      ? withAccountComponentType(line, line.accountId, accounts)
      : line
  )
}

export function sumComponentLineAmounts(lines: ComponentLineDraft[]): number {
  return lines.reduce((acc, line) => {
    const v = lineAmountToNumber(line.amount)
    return acc + (Number.isNaN(v) ? 0 : v)
  }, 0)
}

export function formatAllocationAmountCanonical(
  value: number,
  currency: string
): string {
  const digits = getMoneyFractionDigits(currency)
  if (digits === 0) {
    return formatMoneyInputFromCanonical(String(Math.round(value)), 0)
  }
  return formatMoneyInputFromCanonical(value.toFixed(digits), digits)
}

/** Total canónico (ej. `2500.00`) para estado del formulario; no usar como texto de UI. */
export function linesToTotalAmount(
  lines: ComponentLineDraft[],
  currency: string
): string {
  const sum = sumComponentLineAmounts(lines)
  if (sum <= 0) return ''
  const digits = getMoneyFractionDigits(currency)
  return digits === 0 ? String(Math.round(sum)) : sum.toFixed(digits)
}

export function friendlyLinesSumMatchesTotal(
  lines: ComponentLineDraft[],
  totalAmount: string
): boolean {
  const parsedTotal = lineAmountToNumber(totalAmount)
  if (Number.isNaN(parsedTotal)) return false
  const sum = sumComponentLineAmounts(lines)
  return Math.round(sum * 100) === Math.round(parsedTotal * 100)
}

/** Valor del select unificado cuando la fila es cuenta corriente (sin account_id). */
export const CREDIT_PICKER_VALUE = '__credit__'

export function creditPickerLabel(
  movementType: 'income' | 'expense',
  operationKind?: OperationKind | null
): string {
  if (operationKind === 'collection' || operationKind === 'payment') {
    return 'Cuenta corriente'
  }
  return movementType === 'income'
    ? 'Cuenta corriente (cliente debe)'
    : 'Cuenta corriente (DEBE)'
}

export function linePickerValue(
  line: ComponentLineDraft,
  movementType: 'income' | 'expense'
): string {
  if (isCreditMedium(line.componentType, movementType)) return CREDIT_PICKER_VALUE
  return line.accountId || ''
}

export function applyAccountPickerValue(
  line: ComponentLineDraft,
  value: string,
  movementType: 'income' | 'expense',
  accounts: Pick<Account, 'id' | 'type'>[]
): ComponentLineDraft {
  if (value === CREDIT_PICKER_VALUE) {
    const componentType =
      movementType === 'income' ? 'client_receivable' : 'supplier_payable'
    return {
      ...line,
      componentType,
      accountId: '',
      contactId: line.contactId,
    }
  }
  return withAccountComponentType({ ...line, accountId: value }, value, accounts)
}

export function defaultPaymentLine(
  movementType: 'income' | 'expense',
  accounts: Pick<Account, 'id' | 'type'>[] = [],
  partial?: Partial<ComponentLineDraft>
): ComponentLineDraft {
  const preferred =
    accounts.find((a) => a.type === 'cash') ??
    accounts.find((a) => a.type === 'bank') ??
    accounts[0]
  const base = newComponentLine({ ...partial })
  if (preferred) {
    return withAccountComponentType(base, preferred.id, accounts)
  }
  return newComponentLine({
    componentType: 'operative_cash',
    ...partial,
  })
}
