import { describe, expect, it } from 'vitest'
import {
  resolveMovementDescription,
  defaultComponentTypeForAccount,
  movementHasCustomComponentBreakdown,
} from '../form-defaults'

describe('form-defaults', () => {
  it('usa categoría si la nota es corta', () => {
    expect(
      resolveMovementDescription({
        type: 'income',
        description: '',
        categoryName: 'Ventas',
      })
    ).toBe('Ingreso: Ventas')
  })

  it('respeta nota del usuario', () => {
    expect(
      resolveMovementDescription({
        type: 'expense',
        description: 'Pago proveedor',
        categoryName: 'Costos',
      })
    ).toBe('Pago proveedor')
  })

  it('elige tipo de componente por cuenta', () => {
    expect(defaultComponentTypeForAccount('bank')).toBe('operative_bank')
    expect(defaultComponentTypeForAccount('cash')).toBe('operative_cash')
  })

  it('detecta desglose simple (una línea = cuenta del movimiento)', () => {
    expect(
      movementHasCustomComponentBreakdown(
        [{ componentType: 'operative_cash', accountId: 'acc-1', amount: 80000 }],
        'acc-1',
        80000
      )
    ).toBe(false)
  })

  it('detecta desglose manual (varias líneas o CxC/CxP)', () => {
    expect(
      movementHasCustomComponentBreakdown(
        [
          { componentType: 'operative_cash', accountId: 'a', amount: 40000 },
          { componentType: 'operative_bank', accountId: 'b', amount: 40000 },
        ],
        'a',
        80000
      )
    ).toBe(true)
    expect(
      movementHasCustomComponentBreakdown(
        [{ componentType: 'client_receivable', contactId: 'c1', amount: 80000 }],
        'acc-1',
        80000
      )
    ).toBe(true)
  })
})
