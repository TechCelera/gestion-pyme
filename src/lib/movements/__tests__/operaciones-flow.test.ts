import { describe, expect, it } from 'vitest'
import {
  parseOperacionesFlow,
  operacionesFlowToTypeFilter,
  operacionesFlowHref,
} from '../operaciones-flow'

describe('operaciones-flow', () => {
  it('parsea alias legacy ventas/compras', () => {
    expect(parseOperacionesFlow('ventas')).toBe('ingresos')
    expect(parseOperacionesFlow('compras')).toBe('egresos')
    expect(parseOperacionesFlow('ingresos')).toBe('ingresos')
    expect(parseOperacionesFlow('egresos')).toBe('egresos')
    expect(parseOperacionesFlow(null)).toBe('all')
  })

  it('mapea filtro de tipos', () => {
    expect(operacionesFlowToTypeFilter('ingresos')).toEqual(['income'])
    expect(operacionesFlowToTypeFilter('egresos')).toEqual(['expense'])
    expect(operacionesFlowToTypeFilter('all')).toBeUndefined()
  })

  it('genera href', () => {
    expect(operacionesFlowHref('all')).toBe('/operaciones')
    expect(operacionesFlowHref('ingresos')).toBe('/operaciones?flujo=ingresos')
  })
})
