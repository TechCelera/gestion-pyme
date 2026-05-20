import type { OperationKind } from '@/lib/validations/movement'

export function guidedAccountLabel(
  operationKind: OperationKind,
  type: 'income' | 'expense'
): string {
  if (operationKind === 'collection') return '¿En qué cuenta entró?'
  if (operationKind === 'payment') return '¿De qué cuenta salió?'
  return type === 'income' ? '¿Dónde entró?' : '¿De dónde salió?'
}

export function guidedPaymentModeQuestion(
  operationKind: OperationKind,
  type: 'income' | 'expense'
): string {
  if (operationKind === 'collection') return '¿Se cobró en más de una cuenta?'
  return type === 'income' ? '¿Entró todo de una vez?' : '¿Salió todo de una vez?'
}

export function guidedSingleAccountLabel(
  operationKind: OperationKind,
  type: 'income' | 'expense'
): string {
  if (operationKind === 'collection' || type === 'income') return 'En una cuenta'
  return 'De una cuenta'
}

export function guidedDescriptionPlaceholder(operationKind: OperationKind): string {
  if (operationKind === 'collection') return 'Ej: cobro parcial factura 120'
  if (operationKind === 'payment') return 'Ej: pago proveedor materiales'
  if (operationKind === 'purchase') return 'Ej: compra insumos'
  return 'Ej: venta mostrador'
}
