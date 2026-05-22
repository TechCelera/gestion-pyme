import type { OperationKind } from '@/lib/validations/movement'

/** Pregunta principal al final del formulario guiado. */
export function guidedPaymentQuestion(
  operationKind: OperationKind,
  movementType: 'income' | 'expense'
): string {
  if (operationKind === 'collection') return '¿Cómo te pagaron el cobro?'
  if (operationKind === 'payment') return '¿Cómo pagaste?'
  if (operationKind === 'sale') return '¿Cómo te pagaron?'
  if (operationKind === 'purchase') return '¿Cómo pagaste?'
  return movementType === 'income' ? '¿Cómo te pagaron?' : '¿Cómo pagaste?'
}

export function guidedPaymentRowAccountLabel(): string {
  return 'Cuenta'
}

export function guidedPaymentRowAmountLabel(): string {
  return 'Cantidad'
}

export function guidedAddPaymentRowLabel(): string {
  return 'Añadir otra cuenta y cantidad'
}

export function guidedPaymentTotalLabel(): string {
  return 'Total del movimiento'
}

export function guidedDescriptionPlaceholder(operationKind: OperationKind): string {
  if (operationKind === 'collection') return 'Ej: cobro parcial factura 120'
  if (operationKind === 'payment') return 'Ej: pago proveedor materiales'
  if (operationKind === 'purchase') return 'Ej: compra insumos'
  return 'Ej: venta mostrador'
}
