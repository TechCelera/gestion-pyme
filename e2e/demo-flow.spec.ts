import { test, expect } from '@playwright/test'
import { enterDemoAsGuest } from './helpers/demo-session'

/**
 * Flujo invitado (demo). beforeEach usa cookie + localStorage (estable en next dev).
 * Un test aparte valida el botón de login cuando el servidor ya está caliente.
 */

const NAV_TIMEOUT = 60_000
const VISIBLE_TIMEOUT = 30_000

test.describe('flujo demo (invitado)', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page, baseURL }) => {
    await enterDemoAsGuest(page, baseURL!)
  })

  test('llega al dashboard tras demo', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('página movimientos muestra CTAs de ingreso y egreso', async ({ page }) => {
    await page.goto('/operaciones', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Movimientos' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByRole('button', { name: /Registrar ingreso/i })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await expect(page.getByRole('button', { name: /Registrar egreso/i })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await expect(page.getByRole('tab', { name: 'Ingresos' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('registrar ingreso guiado en demo', async ({ page }) => {
    await page.goto('/operaciones', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Movimientos' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })

    await page.getByRole('main').getByRole('button', { name: /^Registrar ingreso$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(dialog.getByText(/Plata que entró a tu empresa/i)).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })

    await dialog.locator('#amount-guided').fill('12500')
    await dialog.locator('#account-guided').click()
    await page.getByRole('option').first().click()
    await dialog.locator('#category-guided').click()
    await page.getByRole('option').first().click()

    await dialog.getByRole('button', { name: /^Registrar ingreso$/i }).click()
    await expect(page.getByText('Movimiento enviado correctamente')).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('informes carga', async ({ page }) => {
    await page.goto('/reportes', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Reportes' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('cuentas: cabecera y pestañas', async ({ page }) => {
    await page.goto('/cuentas', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Mis cuentas' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByRole('tab', { name: 'Cuentas', exact: true })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await expect(page.getByRole('tab', { name: 'Plan de cuentas', exact: true })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('proyectos lista carga', async ({ page }) => {
    await page.goto('/proyectos', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Proyectos' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('botón invitado en login navega al dashboard', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT })
    const demoBtn = page.getByRole('button', { name: /Entrar como Invitado \(Demo\)/i })
    await expect(demoBtn).toBeEnabled({ timeout: VISIBLE_TIMEOUT })

    await demoBtn.click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: NAV_TIMEOUT })
    await expect(page.getByText(/Estás en modo demo/i)).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })
})
