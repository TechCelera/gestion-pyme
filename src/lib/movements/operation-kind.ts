import type { MovementType, OperationKind } from '@/lib/validations/movement'

const INCOME_KINDS: OperationKind[] = ['sale', 'collection']
const EXPENSE_KINDS: OperationKind[] = ['purchase', 'payment']

export type MovementContactType = 'cliente' | 'proveedor'

export function operationKindToMovementType(kind: OperationKind): 'income' | 'expense' {
  return INCOME_KINDS.includes(kind) ? 'income' : 'expense'
}

export function isSaleOrPurchaseKind(kind: OperationKind | null | undefined): boolean {
  return kind === 'sale' || kind === 'purchase'
}

export function isCollectionOrPaymentKind(kind: OperationKind | null | undefined): boolean {
  return kind === 'collection' || kind === 'payment'
}

export function isIncomeOperationKind(kind: OperationKind): boolean {
  return INCOME_KINDS.includes(kind)
}

export function isExpenseOperationKind(kind: OperationKind): boolean {
  return EXPENSE_KINDS.includes(kind)
}

/** Resuelve subtipo para filas legacy o formularios incompletos. */
export function resolveOperationKind(
  kind: OperationKind | null | undefined,
  type: MovementType
): OperationKind | null {
  if (kind) return kind
  if (type === 'income') return 'sale'
  if (type === 'expense') return 'purchase'
  return null
}

export function defaultOperationKindForType(type: MovementType): OperationKind | null {
  return resolveOperationKind(null, type)
}

/** Valor persistido en RPC / columna `operation_kind`. */
export function resolveOperationKindForPersistence(
  kind: OperationKind | null | undefined,
  type: MovementType
): OperationKind | null {
  return resolveOperationKind(kind, type)
}

export function contactTypeForOperationKind(
  kind: OperationKind | null | undefined
): MovementContactType | undefined {
  if (kind === 'collection') return 'cliente'
  if (kind === 'payment') return 'proveedor'
  return undefined
}

export type OperationKindTypeMismatch = {
  kind: OperationKind
  expectedType: 'income' | 'expense'
  message: string
}

const KIND_TYPE_RULES: OperationKindTypeMismatch[] = [
  { kind: 'sale', expectedType: 'income', message: 'Venta debe ser de tipo ingreso' },
  { kind: 'collection', expectedType: 'income', message: 'Cobro debe ser de tipo ingreso' },
  { kind: 'purchase', expectedType: 'expense', message: 'Compra debe ser de tipo egreso' },
  { kind: 'payment', expectedType: 'expense', message: 'Pago debe ser de tipo egreso' },
]

export function validateOperationKindMatchesType(
  kind: OperationKind,
  type: MovementType
): OperationKindTypeMismatch | null {
  const rule = KIND_TYPE_RULES.find((r) => r.kind === kind)
  if (!rule || rule.expectedType === type) return null
  return rule
}

export function requiresCategoryForKind(kind: OperationKind | null | undefined): boolean {
  return isSaleOrPurchaseKind(kind)
}

export function requiresContactForKind(kind: OperationKind | null | undefined): boolean {
  return isCollectionOrPaymentKind(kind)
}
