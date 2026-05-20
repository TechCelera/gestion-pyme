import { describe, expect, it } from 'vitest'

import {
  categoryDetailValue,
  contactFieldLabel,
  operationKindDetailLabel,
  resolveDisplayedContactName,
  shouldShowCategoryInDetail,
  shouldShowContactInDetail,
} from '../movement-detail-display'

describe('movement-detail-display', () => {
  it('muestra categoría solo en venta/compra', () => {
    expect(shouldShowCategoryInDetail('sale')).toBe(true)
    expect(shouldShowCategoryInDetail('purchase')).toBe(true)
    expect(shouldShowCategoryInDetail('collection')).toBe(false)
    expect(shouldShowCategoryInDetail('payment')).toBe(false)
  })

  it('muestra contacto en cobro/pago o si hay contact_id', () => {
    expect(shouldShowContactInDetail('collection', null)).toBe(true)
    expect(shouldShowContactInDetail('sale', 'c1')).toBe(true)
    expect(shouldShowContactInDetail('sale', null)).toBe(false)
  })

  it('etiqueta cliente/proveedor según subtipo', () => {
    expect(contactFieldLabel('collection')).toBe('Cliente')
    expect(contactFieldLabel('payment')).toBe('Proveedor')
  })

  it('categoría en cobro es no aplica', () => {
    expect(categoryDetailValue('collection', null)).toMatch(/no aplica/i)
    expect(categoryDetailValue('sale', 'Ventas')).toBe('Ventas')
  })

  it('resuelve nombre de contacto desde RPC o lista', () => {
    expect(
      resolveDisplayedContactName({
        contactId: 'c1',
        contactName: '  Acme  ',
        contacts: [],
      })
    ).toBe('Acme')

    expect(
      resolveDisplayedContactName({
        contactId: 'c1',
        contactName: null,
        contacts: [{ id: 'c1', name: 'Desde lista' }],
      })
    ).toBe('Desde lista')
  })

  it('expone etiqueta de subtipo', () => {
    expect(operationKindDetailLabel('collection')).toBe('Cobro')
  })
})
