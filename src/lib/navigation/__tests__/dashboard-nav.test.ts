import { describe, expect, it } from 'vitest'

import { ROUTES } from '@/lib/constants'
import { shouldShowDashboardNavItem } from '@/lib/navigation/dashboard-nav'

describe('dashboard-nav', () => {
  it('default muestra todo', () => {
    expect(shouldShowDashboardNavItem('/proyectos', 'default', false)).toBe(true)
    expect(shouldShowDashboardNavItem(ROUTES.CATEGORIES, 'default', false)).toBe(true)
  })

  it('distribuidora oculta proyectos', () => {
    expect(shouldShowDashboardNavItem('/proyectos', 'distribuidora', true)).toBe(false)
    expect(shouldShowDashboardNavItem('/proyectos/nuevo', 'distribuidora', true)).toBe(false)
  })

  it('distribuidora oculta categorías para operador', () => {
    expect(shouldShowDashboardNavItem(ROUTES.CATEGORIES, 'distribuidora', false)).toBe(false)
    expect(shouldShowDashboardNavItem(ROUTES.CATEGORIES, 'distribuidora', true)).toBe(true)
  })

  it('distribuidora mantiene movimientos e informes', () => {
    expect(shouldShowDashboardNavItem(ROUTES.MOVEMENTS, 'distribuidora', false)).toBe(true)
    expect(shouldShowDashboardNavItem(ROUTES.REPORTS, 'distribuidora', false)).toBe(true)
  })
})
