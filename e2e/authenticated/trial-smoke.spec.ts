import { test, expect } from '@playwright/test'

import { hasE2eCredentials, hasSupabasePublicEnv } from '../helpers/auth'

/**
 * Recorrido mínimo de piloto: rutas autenticadas críticas sin mutar datos.
 */
test.describe('piloto — rutas autenticadas', () => {
  test.beforeEach(() => {
    test.skip(
      !hasSupabasePublicEnv() || !hasE2eCredentials(),
      'Requiere NEXT_PUBLIC_SUPABASE_* y E2E_TEST_EMAIL / E2E_TEST_PASSWORD'
    )
  })

  const routes: { path: string; heading: RegExp }[] = [
    { path: '/dashboard', heading: /panel|dashboard|resumen/i },
    { path: '/operaciones', heading: /movimientos|operaciones/i },
    { path: '/reportes', heading: /reportes/i },
    { path: '/categorias', heading: /categorías/i },
    { path: '/cuentas', heading: /mis cuentas/i },
    { path: '/proyectos', heading: /proyectos/i },
    { path: '/configuracion', heading: /configuración|configuracion/i },
  ]

  for (const { path, heading } of routes) {
    test(`carga ${path}`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')))
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({
        timeout: 30_000,
      })
    })
  }

  test('filtros de período visibles en reportes', async ({ page }) => {
    await page.goto('/reportes')
    await expect(page.getByRole('tab', { name: /este mes/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /trimestre anterior/i })).toBeVisible()
  })

  test('filtros de flujo visibles en operaciones', async ({ page }) => {
    await page.goto('/operaciones')
    await expect(page.getByRole('tab', { name: /^todo$/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /ingresos/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /egresos/i })).toBeVisible()
  })
})
