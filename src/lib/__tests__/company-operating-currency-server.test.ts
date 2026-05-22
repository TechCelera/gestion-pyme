import { describe, expect, it } from 'vitest'
import {
  isOperatingCurrency,
  operatingCurrencyMismatchMessage,
} from '@/lib/company-operating-currency-server'

describe('company-operating-currency-server', () => {
  it('isOperatingCurrency compara código exacto', () => {
    expect(isOperatingCurrency('ARS', 'ARS')).toBe(true)
    expect(isOperatingCurrency('ARS', 'USD')).toBe(false)
  })

  it('operatingCurrencyMismatchMessage incluye moneda esperada', () => {
    expect(operatingCurrencyMismatchMessage('COP')).toContain('COP')
  })
})
