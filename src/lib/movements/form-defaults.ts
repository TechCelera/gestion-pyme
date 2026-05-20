import { DEFAULT_TRANSFER_DESCRIPTION } from '@/lib/validations/movement'
import type { MovementType, OperationKind } from '@/lib/validations/movement'
import { isCollectionOrPaymentKind } from '@/lib/movements/operation-kind'
import type { MovementComponentType } from '@/lib/validations/movement'

export function defaultComponentTypeForAccount(
  accountType: string | undefined
): MovementComponentType {
  return accountType === 'bank' ? 'operative_bank' : 'operative_cash'
}

/** Descripción válida (≥3 chars) para ingresos/egresos; transferencias tienen default propio. */
export function resolveMovementDescription(input: {
  type: MovementType
  operationKind?: OperationKind | null
  description: string
  categoryName?: string | null
  contactName?: string | null
}): string {
  const trimmed = input.description.trim()

  if (input.type === 'transfer') {
    return trimmed.length >= 3 ? trimmed : DEFAULT_TRANSFER_DESCRIPTION
  }

  if (trimmed.length >= 3) return trimmed

  if (isCollectionOrPaymentKind(input.operationKind) && input.contactName) {
    const label = input.operationKind === 'collection' ? 'Cobro' : 'Pago'
    return `${label}: ${input.contactName}`.slice(0, 500)
  }

  if (input.categoryName) {
    const prefixByKind: Record<string, string> = {
      sale: 'Venta',
      purchase: 'Compra',
      collection: 'Cobro',
      payment: 'Pago',
    }
    const prefix =
      (input.operationKind && prefixByKind[input.operationKind]) ||
      (input.type === 'income' ? 'Ingreso' : input.type === 'expense' ? 'Egreso' : 'Movimiento')
    return `${prefix}: ${input.categoryName}`.slice(0, 500)
  }

  return trimmed
}

export function isIncomeExpenseType(type: MovementType): boolean {
  return type === 'income' || type === 'expense'
}

export type ComponentBreakdownSource = {
  componentType: string
  accountId?: string | null
  contactId?: string | null
  amount: number | string
}

/** True cuando el movimiento guardó un desglose que no se puede inferir solo de cuenta + monto. */
export function movementHasCustomComponentBreakdown(
  components: ComponentBreakdownSource[],
  movementAccountId: string,
  movementAmount: number
): boolean {
  if (components.length > 1) return true
  if (components.length === 0) return false

  const line = components[0]!
  if (
    line.componentType === 'client_receivable' ||
    line.componentType === 'supplier_payable'
  ) {
    return true
  }

  const accountId = line.accountId ?? ''
  if (accountId && accountId !== movementAccountId) return true

  const amt =
    typeof line.amount === 'number' ? line.amount : parseFloat(String(line.amount))
  if (
    !Number.isNaN(amt) &&
    Math.round(amt * 100) !== Math.round(movementAmount * 100)
  ) {
    return true
  }

  return false
}
