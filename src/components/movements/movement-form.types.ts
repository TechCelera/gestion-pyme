import type { MovementComponentType } from '@/lib/validations/movement'
import { moneyInputToNumber } from '@/lib/utils/money-input'

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

export function componentTypesForMovement(type: 'income' | 'expense') {
  return type === 'income' ? INCOME_COMPONENT_TYPES : EXPENSE_COMPONENT_TYPES
}

export function lineAmountToNumber(amount: string): number {
  return moneyInputToNumber(amount)
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
