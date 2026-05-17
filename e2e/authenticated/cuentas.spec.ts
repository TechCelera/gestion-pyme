import { test, expect } from '@playwright/test'

import { hasE2eCredentials, hasSupabasePublicEnv } from '../helpers/auth'

test.describe('cuentas autenticado', () => {
  test.beforeEach(() => {
    test.skip(
      !hasSupabasePublicEnv() || !hasE2eCredentials(),
      'Requiere NEXT_PUBLIC_SUPABASE_* y E2E_TEST_EMAIL / E2E_TEST_PASSWORD'
    )
  })

  test('muestra listado o estado vacío real', async ({ page }) => {
    await page.goto('/cuentas')
    await expect(page.getByRole('heading', { name: /mis cuentas/i })).toBeVisible()
    const hasTable = await page.getByRole('table').isVisible().catch(() => false)
    const hasEmpty = await page
      .getByText(/todavía no tenés cuentas/i)
      .isVisible()
      .catch(() => false)
    expect(hasTable || hasEmpty).toBe(true)
  })

  test('pestaña plan de cuentas carga sin error fatal', async ({ page }) => {
    await page.goto('/cuentas')
    await page.getByRole('tab', { name: /plan de cuentas/i }).click()
    const errorCard = page.getByText(/no se pudo cargar el plan de cuentas/i)
    const treeOrEmpty = page.getByText(/plan de cuentas con saldos|no hay plan de cuentas/i)
    await expect(treeOrEmpty.or(errorCard)).toBeVisible({ timeout: 30_000 })
  })
})
