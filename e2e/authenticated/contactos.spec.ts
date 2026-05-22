import { test, expect } from '@playwright/test'

import { hasE2eCredentials, hasSupabasePublicEnv } from '../helpers/auth'

test.describe('contactos autenticado', () => {
  test.beforeEach(() => {
    test.skip(
      !hasSupabasePublicEnv() || !hasE2eCredentials(),
      'Requiere NEXT_PUBLIC_SUPABASE_* y E2E_TEST_EMAIL / E2E_TEST_PASSWORD'
    )
  })

  test('clientes: drawer con campos, padding y pie estándar', async ({ page }) => {
    await page.goto('/clientes')
    await expect(page.getByRole('heading', { name: /^clientes$/i })).toBeVisible()

    await page.getByRole('button', { name: /^nuevo$/i }).click()

    const sheet = page.getByRole('dialog', { name: /nuevo cliente/i })
    await expect(sheet).toBeVisible()
    await expect(sheet.getByLabel(/^nombre$/i)).toBeVisible()
    await expect(sheet.getByLabel(/^teléfono$/i)).toBeVisible()
    await expect(sheet.getByLabel(/segmento/i)).toBeVisible()
    await expect(sheet.getByRole('button', { name: /cancelar/i })).toBeVisible()
    await expect(sheet.getByRole('button', { name: /crear cliente/i })).toBeDisabled()

    const footer = sheet.locator('[data-slot="sheet-form-footer"]')
    await expect(footer).toBeVisible()
    await expect(footer).toHaveClass(/grid-cols-2/)
  })

  test('proveedores: drawer sin campos de cliente', async ({ page }) => {
    await page.goto('/proveedores')
    await expect(page.getByRole('heading', { name: /^proveedores$/i })).toBeVisible()

    await page.getByRole('button', { name: /^nuevo$/i }).click()

    const sheet = page.getByRole('dialog', { name: /nuevo proveedor/i })
    await expect(sheet).toBeVisible()
    await expect(sheet.getByLabel(/segmento/i)).toHaveCount(0)
    await expect(sheet.getByLabel(/servicios/i)).toHaveCount(0)
    await expect(sheet.getByRole('button', { name: /crear proveedor/i })).toBeDisabled()
  })

  test('clientes: alta mínima con toast de éxito', async ({ page }) => {
    await page.goto('/clientes')
    await page.getByRole('button', { name: /^nuevo$/i }).click()

    const sheet = page.getByRole('dialog', { name: /nuevo cliente/i })
    const unique = `E2E Cliente ${Date.now()}`
    await sheet.getByLabel(/^nombre$/i).fill(unique)
    await sheet.getByLabel(/^teléfono$/i).fill('11 5555-0100')
    await sheet.getByRole('button', { name: /crear cliente/i }).click()

    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /cliente creado/i })
    ).toBeVisible({ timeout: 15_000 })
    await expect(sheet).toBeHidden()
  })

  test('proveedores: alta mínima con toast de éxito', async ({ page }) => {
    await page.goto('/proveedores')
    await page.getByRole('button', { name: /^nuevo$/i }).click()

    const sheet = page.getByRole('dialog', { name: /nuevo proveedor/i })
    const unique = `E2E Proveedor ${Date.now()}`
    await sheet.getByLabel(/^nombre$/i).fill(unique)
    await sheet.getByLabel(/^teléfono$/i).fill('11 5555-0200')
    await sheet.getByRole('button', { name: /crear proveedor/i }).click()

    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /proveedor creado/i })
    ).toBeVisible({ timeout: 15_000 })
    await expect(sheet).toBeHidden()
  })
})
