import { describe, expect, it } from 'vitest'

import { newComponentLine } from '@/components/movements/movement-form.types'
import { linesToTotalAmount, sumComponentLineAmounts } from '@/lib/movements/payment-medium'

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
})
