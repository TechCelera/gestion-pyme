import { describe, expect, it } from 'vitest'
import {
  contactTypeForOperationKind,
  defaultOperationKindForType,
  isCollectionOrPaymentKind,
  isSaleOrPurchaseKind,
  operationKindToMovementType,
  requiresCategoryForKind,
  requiresContactForKind,
  resolveOperationKind,
  validateOperationKindMatchesType,
} from '../operation-kind'

describe('operation-kind', () => {
  it('mapea subtipos a income/expense', () => {
    expect(operationKindToMovementType('sale')).toBe('income')
    expect(operationKindToMovementType('collection')).toBe('income')
    expect(operationKindToMovementType('purchase')).toBe('expense')
    expect(operationKindToMovementType('payment')).toBe('expense')
  })

  it('clasifica venta/compra vs cobro/pago', () => {
    expect(isSaleOrPurchaseKind('sale')).toBe(true)
    expect(isSaleOrPurchaseKind('collection')).toBe(false)
    expect(isCollectionOrPaymentKind('payment')).toBe(true)
    expect(isCollectionOrPaymentKind('purchase')).toBe(false)
  })

  it('resuelve legacy sin operation_kind', () => {
    expect(resolveOperationKind(null, 'income')).toBe('sale')
    expect(resolveOperationKind(undefined, 'expense')).toBe('purchase')
    expect(defaultOperationKindForType('income')).toBe('sale')
  })

  it('exige categoría solo en venta/compra y contacto en cobro/pago', () => {
    expect(requiresCategoryForKind('sale')).toBe(true)
    expect(requiresCategoryForKind('collection')).toBe(false)
    expect(requiresContactForKind('payment')).toBe(true)
    expect(requiresContactForKind('sale')).toBe(false)
  })

  it('asigna tipo de contacto por subtipo', () => {
    expect(contactTypeForOperationKind('collection')).toBe('cliente')
    expect(contactTypeForOperationKind('payment')).toBe('proveedor')
    expect(contactTypeForOperationKind('sale')).toBeUndefined()
  })

  it('valida coherencia kind vs type', () => {
    expect(validateOperationKindMatchesType('sale', 'income')).toBeNull()
    expect(validateOperationKindMatchesType('sale', 'expense')?.message).toMatch(/Venta/)
    expect(validateOperationKindMatchesType('payment', 'income')?.message).toMatch(/Pago/)
  })
})
