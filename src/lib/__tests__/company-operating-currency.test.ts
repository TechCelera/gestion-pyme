import { describe, expect, it } from 'vitest'
import { currencyForCountry, normalizeCompanyCountry } from '@/lib/company-operating-currency'

describe('company-operating-currency', () => {
  it('normaliza país desconocido a AR', () => {
    expect(normalizeCompanyCountry('xx')).toBe('AR')
  })

  it('mapea CO a COP y AR a ARS', () => {
    expect(currencyForCountry('CO')).toBe('COP')
    expect(currencyForCountry('AR')).toBe('ARS')
  })
})
