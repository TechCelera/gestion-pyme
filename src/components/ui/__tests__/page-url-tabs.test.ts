import { describe, it, expect } from 'vitest'
import { pageTabsFromPresets } from '../page-url-tabs'

describe('pageTabsFromPresets', () => {
  it('mapea key y label a value y label de PageTabItem', () => {
    const tabs = pageTabsFromPresets([
      { key: 'all', label: 'Todas' },
      { key: 'income', label: 'Ingresos' },
    ] as const)
    expect(tabs).toEqual([
      { value: 'all', label: 'Todas' },
      { value: 'income', label: 'Ingresos' },
    ])
  })

  it('devuelve arreglo vacío si no hay presets', () => {
    expect(pageTabsFromPresets([])).toEqual([])
  })
})
