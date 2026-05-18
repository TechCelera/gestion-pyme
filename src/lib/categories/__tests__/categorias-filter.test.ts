import { describe, it, expect } from 'vitest'
import {
  categoriasFilterHint,
  categoriasFilterHref,
  parseCategoriasFilter,
} from '../categorias-filter'

describe('categoriasFilterHref', () => {
  it('omite query en todas', () => {
    expect(categoriasFilterHref('all')).toBe('/categorias')
  })

  it('añade tipo para ingreso o gasto', () => {
    expect(categoriasFilterHref('income')).toBe('/categorias?tipo=income')
    expect(categoriasFilterHref('expense')).toBe('/categorias?tipo=expense')
  })
})

describe('parseCategoriasFilter', () => {
  it('usa all para valores inválidos', () => {
    expect(parseCategoriasFilter(null)).toBe('all')
    expect(parseCategoriasFilter('foo')).toBe('all')
  })
})

describe('categoriasFilterHint', () => {
  it('describe el filtro activo', () => {
    expect(categoriasFilterHint('income')).toMatch(/ingresos/i)
    expect(categoriasFilterHint('all')).toMatch(/todas las categorías/i)
  })
})
