import { test, expect } from '@playwright/test'
import { clearDemoSession, enterDemoAsGuest } from './helpers/demo-session'

/**
 * Flujo invitado (demo). La mayoría de tests precargan cookie + localStorage.
 * El login desde cero va en un describe aparte (sin beforeEach) para evitar flakes.
 */

const NAV_TIMEOUT = 60_000
const VISIBLE_TIMEOUT = 30_000

test.describe('flujo demo (invitado)', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('con sesión precargada', () => {
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
    await expect(page.getByRole('main').getByRole('button', { name: /ingreso/i })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await expect(page.getByRole('main').getByRole('button', { name: /egreso/i })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await expect(page.getByRole('tab', { name: 'Ingresos' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('registrar ingreso guiado en demo', async ({ page }) => {
    await page.goto('/operaciones', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Movimientos' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })

    await page.getByRole('main').getByRole('button', { name: /ingreso/i }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(dialog.getByLabel('¿Cuánto?')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(dialog.getByLabel('Moneda', { exact: true })).toBeVisible({
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

  test('categorías: listado carga', async ({ page }) => {
    await page.goto('/categorias', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Categorías' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('configuración: sección de perfil', async ({ page }) => {
    await page.goto('/configuracion', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByText('Perfil', { exact: true })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByText('Contraseña', { exact: true })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })
  })

  test.describe('login desde cero', () => {
    test('botón invitado en login navega al dashboard', async ({ page, baseURL }) => {
      await clearDemoSession(page, baseURL!)
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle')

      const demoBtn = page.getByRole('button', { name: /Entrar como Invitado \(Demo\)/i })
      await expect(demoBtn).toBeEnabled({ timeout: VISIBLE_TIMEOUT })

      await Promise.all([
        page.waitForURL(/\/dashboard/, { timeout: NAV_TIMEOUT, waitUntil: 'domcontentloaded' }),
        demoBtn.click(),
      ])
      await expect(page.getByText(/Estás en modo demo/i)).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    })
  })
})
