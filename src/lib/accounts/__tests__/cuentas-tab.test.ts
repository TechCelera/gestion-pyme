import { describe, it, expect } from 'vitest'
import { cuentasTabHint, cuentasTabHref, parseCuentasTab } from '../cuentas-tab'

describe('cuentasTabHref', () => {
  it('omite query en cuentas operativas', () => {
    expect(cuentasTabHref('accounts')).toBe('/cuentas')
  })

  it('añade tab=chart para el plan', () => {
    expect(cuentasTabHref('chart')).toBe('/cuentas?tab=chart')
  })
})

describe('parseCuentasTab', () => {
  it('usa accounts por defecto', () => {
    expect(parseCuentasTab(null)).toBe('accounts')
    expect(parseCuentasTab('unknown')).toBe('accounts')
  })

  it('acepta chart', () => {
    expect(parseCuentasTab('chart')).toBe('chart')
  })
})

describe('cuentasTabHint', () => {
  it('describe cada vista', () => {
    expect(cuentasTabHint('accounts')).toMatch(/día a día/i)
    expect(cuentasTabHint('chart')).toMatch(/solo lectura/i)
  })
})
