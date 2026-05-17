import { test, expect } from '@playwright/test'

import { hasE2eCredentials, hasSupabasePublicEnv } from '../helpers/auth'

test.describe('dashboard autenticado', () => {
  test.beforeEach(() => {
    test.skip(
      !hasSupabasePublicEnv() || !hasE2eCredentials(),
      'Requiere NEXT_PUBLIC_SUPABASE_* y E2E_TEST_EMAIL / E2E_TEST_PASSWORD'
    )
  })

  test('carga el panel principal', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /panel|dashboard|resumen/i }).first()).toBeVisible({
      timeout: 30_000,
    })
  })

  test('navega a operaciones', async ({ page }) => {
    await page.goto('/operaciones')
    await expect(page).toHaveURL(/\/operaciones/)
    await expect(page.getByRole('heading', { name: /movimientos|operaciones/i }).first()).toBeVisible({
      timeout: 30_000,
    })
  })
})
