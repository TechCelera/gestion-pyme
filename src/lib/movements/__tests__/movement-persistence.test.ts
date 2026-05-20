import { describe, expect, it } from 'vitest'
import { resolveIncomeExpensePersistenceFields } from '../movement-persistence'

describe('movement-persistence', () => {
  it('persiste categoría en venta/compra y la omite en cobro/pago', () => {
    const sale = resolveIncomeExpensePersistenceFields({
      type: 'income',
      operationKind: 'sale',
      categoryId: 'cat-1',
      contactId: 'contact-1',
    })
    expect(sale.operationKind).toBe('sale')
    expect(sale.categoryId).toBe('cat-1')
    expect(sale.contactId).toBeNull()

    const collection = resolveIncomeExpensePersistenceFields({
      type: 'income',
      operationKind: 'collection',
      categoryId: 'cat-1',
      contactId: 'contact-1',
    })
    expect(collection.categoryId).toBeNull()
    expect(collection.contactId).toBe('contact-1')
    expect(collection.contactType).toBe('cliente')
  })

  it('resuelve subtipo legacy desde type', () => {
    const legacy = resolveIncomeExpensePersistenceFields({
      type: 'expense',
      categoryId: 'cat-2',
    })
    expect(legacy.operationKind).toBe('purchase')
    expect(legacy.categoryId).toBe('cat-2')
  })
})
