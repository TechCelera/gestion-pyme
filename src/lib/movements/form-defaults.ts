import { DEFAULT_TRANSFER_DESCRIPTION } from '@/lib/validations/movement'
import type { MovementType } from '@/lib/validations/movement'
import type { MovementComponentType } from '@/lib/validations/movement'

export function defaultComponentTypeForAccount(
  accountType: string | undefined
): MovementComponentType {
  return accountType === 'bank' ? 'operative_bank' : 'operative_cash'
}

/** Descripción válida (≥3 chars) para ingresos/egresos; transferencias tienen default propio. */
export function resolveMovementDescription(input: {
  type: MovementType
  description: string
  categoryName?: string | null
}): string {
  const trimmed = input.description.trim()

  if (input.type === 'transfer') {
    return trimmed.length >= 3 ? trimmed : DEFAULT_TRANSFER_DESCRIPTION
  }

  if (trimmed.length >= 3) return trimmed

  if (input.categoryName) {
    const prefix =
      input.type === 'income' ? 'Ingreso' : input.type === 'expense' ? 'Egreso' : 'Movimiento'
    return `${prefix}: ${input.categoryName}`.slice(0, 500)
  }

  return trimmed
}

export function isIncomeExpenseType(type: MovementType): boolean {
  return type === 'income' || type === 'expense'
}
