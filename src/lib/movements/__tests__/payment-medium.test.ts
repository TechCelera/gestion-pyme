import { describe, expect, it } from 'vitest'

import { newComponentLine } from '@/components/movements/movement-form.types'
import {
  formatAllocationAmountCanonical,
  linesToTotalAmount,
  sumComponentLineAmounts,
} from '@/lib/movements/payment-medium'
import { moneyInputToNumber, parseMoneyInputToCanonical } from '@/lib/utils/money-input'

describe('payment-medium allocation', () => {
  it('linesToTotalAmount suma las cantidades de cada fila', () => {
    const lines = [
      { ...newComponentLine(), amount: '15000' },
      { ...newComponentLine(), amount: '10000' },
    ]
    expect(sumComponentLineAmounts(lines)).toBe(25000)
    const total = linesToTotalAmount(lines, 'ARS')
    expect(total.replace(/\D/g, '')).toContain('25000')
  })

  it('formatAllocationAmountCanonical no trata miles como decimal (2500 ARS)', () => {
    const formatted = formatAllocationAmountCanonical(2500, 'ARS')
    expect(formatted).toBe('2.500,00')
    const canonical = parseMoneyInputToCanonical(formatted, 2)
    expect(moneyInputToNumber(canonical)).toBe(2500)
  })

  it('linesToTotalAmount devuelve monto canónico (2500.00)', () => {
    const lines = [{ ...newComponentLine(), amount: '2500.00' }]
    expect(sumComponentLineAmounts(lines)).toBe(2500)
    expect(linesToTotalAmount(lines, 'ARS')).toBe('2500.00')
  })
})
