import { test, expect } from '@playwright/test'

/**
 * Flujo invitado (demo): no usa Supabase; valida navegación principal.
 *
 * Se usa waitUntil:'commit' y 'domcontentloaded' en lugar de 'load' porque
 * el dev server sobre /mnt/datos (filesystem lento) puede tardar >30s en
 * disparar el evento load completo. Con SSR de Next.js el contenido ya está
 * en el HTML al momento de domcontentloaded.
 */

const NAV_TIMEOUT = 45_000
const VISIBLE_TIMEOUT = 30_000

test.describe('flujo demo (invitado)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /Entrar como Invitado \(Demo\)/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: NAV_TIMEOUT, waitUntil: 'commit' })
  })

  test('llega al dashboard tras demo', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText('Estás en modo demo')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('página movimientos muestra título y CTA', async ({ page }) => {
    await page.goto('/operaciones', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Movimientos' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByRole('button', { name: /Nuevo movimiento/i })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('informes carga', async ({ page }) => {
    await page.goto('/reportes', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Reportes' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('cuentas: cabecera y pestañas', async ({ page }) => {
    await page.goto('/cuentas', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Mis cuentas' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByRole('tab', { name: /Cuentas/i })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('proyectos lista carga', async ({ page }) => {
    await page.goto('/proyectos', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Proyectos' })).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })
})
