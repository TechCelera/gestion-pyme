import { test, expect, type Page } from '@playwright/test'

import { loginViaUi } from '../helpers/auth'
import {
  hasMatiasDemoCredentials,
  matiasAdminCredentials,
  matiasOperatorCredentials,
} from '../helpers/matias-demo'

test.describe('Matías Distribuidora — piloto demo', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(({ page: _page }) => {
    test.skip(
      !hasMatiasDemoCredentials(),
      'Requiere NEXT_PUBLIC_SUPABASE_*, seed matias-demo y credenciales DEMO_* / E2E_MATIAS_*'
    )
  })

  async function loginAs(page: Page, role: 'admin' | 'operator'): Promise<void> {
    const creds = role === 'admin' ? matiasAdminCredentials() : matiasOperatorCredentials()
    if (!creds) {
      throw new Error('Credenciales Matías demo no configuradas')
    }
    await page.context().clearCookies()
    await loginViaUi(page, creds.email, creds.password)
  }

  test('admin: dashboard carga con resultado bruto/neto', async ({ page }) => {
    await loginAs(page, 'admin')

    await expect(page.getByRole('heading', { name: /resumen del día/i })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText(/error al cargar el dashboard/i)).toHaveCount(0)
    await expect(page.getByText(/no se pudieron cargar los gráficos/i)).toHaveCount(0)

    await expect(page.getByText('Resultado distribuidora')).toBeVisible()
    await expect(page.getByText('= Resultado bruto')).toBeVisible()
    await expect(page.getByText('= Resultado neto')).toBeVisible()
    await expect(page.getByText('Vista operativa')).toHaveCount(0)
  })

  test('admin: reportes muestra estado de resultados', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/reportes')
    await expect(page.getByRole('heading', { name: /^reportes$/i })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText(/no se pudieron cargar los reportes/i)).toHaveCount(0)
    await expect(
      page.locator('[data-slot=card-title]').filter({ hasText: /^Estado de Resultados$/ })
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Resultado distribuidora')).toBeVisible()
  })

  test('operador: dashboard operativo sin bruto/neto', async ({ page }) => {
    await loginAs(page, 'operator')

    await expect(page.getByRole('heading', { name: /resumen del día/i })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText(/error al cargar el dashboard/i)).toHaveCount(0)
    await expect(page.getByText('Vista operativa')).toBeVisible()
    await expect(page.getByText('Resultado distribuidora')).toHaveCount(0)
    await expect(page.getByText('= Resultado bruto')).toHaveCount(0)
    await expect(page.getByText('= Resultado neto')).toHaveCount(0)
  })

  test('operador: reportes sin P&L ni balance', async ({ page }) => {
    await loginAs(page, 'operator')
    await page.goto('/reportes')
    await expect(page.getByRole('heading', { name: /^reportes$/i })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText(/no se pudieron cargar los reportes/i)).toHaveCount(0)
    await expect(page.getByText(/flujo de caja operativo/i)).toBeVisible({ timeout: 30_000 })
    await expect(
      page.locator('[data-slot=card-title]').filter({ hasText: /^Estado de Resultados$/ })
    ).toHaveCount(0)
    await expect(page.getByText('Balance (diario)')).toHaveCount(0)
    await expect(page.getByText('Resultado distribuidora')).toHaveCount(0)
  })

  test('operador: puede abrir movimientos y registrar cobro', async ({ page }) => {
    await loginAs(page, 'operator')
    await page.goto('/operaciones')
    await expect(page.getByRole('heading', { name: /^movimientos$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^cobro$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^venta$/i })).toBeVisible()
    await page.getByRole('button', { name: /^cobro$/i }).click()
    await expect(page.getByRole('heading', { name: /registrar cobro/i })).toBeVisible({
      timeout: 15_000,
    })
  })
})
