import { describe, expect, it } from 'vitest'
import { resolveMovementDescription, defaultComponentTypeForAccount } from '../form-defaults'

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
})
