import { describe, expect, it } from 'vitest'

import {
  formatMoneyInputFromCanonical,
  getMoneyFractionDigits,
  moneyInputToNumber,
  parseMoneyInputToCanonical,
} from '@/lib/utils/money-input'

describe('money-input', () => {
  it('fraction digits by currency', () => {
    expect(getMoneyFractionDigits('ARS')).toBe(2)
    expect(getMoneyFractionDigits('COP')).toBe(0)
  })

  it('formats thousands while typing', () => {
    expect(formatMoneyInputFromCanonical('1500000')).toBe('1.500.000')
    expect(formatMoneyInputFromCanonical('1234.56')).toBe('1.234,56')
  })

  it('parses es-AR display to canonical', () => {
    expect(parseMoneyInputToCanonical('1.234,56')).toBe('1234.56')
    expect(parseMoneyInputToCanonical('1500000')).toBe('1500000')
  })

  it('keeps trailing decimal separator while typing', () => {
    expect(parseMoneyInputToCanonical('1234,')).toBe('1234.')
    expect(formatMoneyInputFromCanonical('1234.')).toBe('1.234,')
  })

  it('converts canonical to number', () => {
    expect(moneyInputToNumber('1234.56')).toBe(1234.56)
  })

  it('COP: sin decimales al parsear ni formatear', () => {
    expect(parseMoneyInputToCanonical('1.250.000', 0)).toBe('1250000')
    expect(formatMoneyInputFromCanonical('1250000', 0)).toBe('1.250.000')
    expect(parseMoneyInputToCanonical('1.250.000,50', 0)).toBe('1250000')
  })

  it('vacío y solo separadores devuelven cadena vacía', () => {
    expect(parseMoneyInputToCanonical('')).toBe('')
    expect(parseMoneyInputToCanonical('   ')).toBe('')
    expect(parseMoneyInputToCanonical(',,')).toBe('')
    expect(formatMoneyInputFromCanonical('')).toBe('')
  })

  it('roundtrip: tipeo con miles y coma decimal', () => {
    const canonical = parseMoneyInputToCanonical('2.500.000,75')
    expect(canonical).toBe('2500000.75')
    expect(formatMoneyInputFromCanonical(canonical)).toBe('2.500.000,75')
    expect(moneyInputToNumber(canonical)).toBe(2_500_000.75)
  })
})
