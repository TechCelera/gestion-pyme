import { expect, type Page } from '@playwright/test'
import path from 'node:path'

export const AUTH_STORAGE_PATH = path.join(__dirname, '../.auth/user.json')

export function e2eCredentials(): { email: string; password: string } | null {
  const email = process.env.E2E_TEST_EMAIL?.trim()
  const password = process.env.E2E_TEST_PASSWORD
  if (!email || !password) return null
  return { email, password }
}

export function hasE2eCredentials(): boolean {
  return e2eCredentials() !== null
}

export function hasSupabasePublicEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  )
}

export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible()

  const emailInput = page.locator('#email')
  const passwordInput = page.locator('input#password')
  const emailReadonly = (await emailInput.getAttribute('readonly')) !== null

  if (emailReadonly) {
    await expect(emailInput).toHaveValue(email)
    await expect(passwordInput).toHaveValue(password)
  } else {
    await emailInput.fill(email)
    await passwordInput.fill(password)
  }

  await page.getByRole('button', { name: /iniciar sesión/i }).click()

  try {
    await page.waitForURL(/\/dashboard/, {
      timeout: 60_000,
      waitUntil: 'domcontentloaded',
    })
  } catch (error) {
    if (page.url().includes('/login')) {
      const toastText = await page
        .locator('[data-sonner-toast]')
        .first()
        .textContent()
        .catch(() => null)
      throw new Error(
        `Login E2E falló: ${toastText?.trim() || 'correo o contraseña incorrectos'}. ` +
          'Actualizá E2E_TEST_EMAIL y E2E_TEST_PASSWORD en .env.local (usuario confirmado en Supabase).',
        { cause: error }
      )
    }
    throw error
  }

  await expect(page).toHaveURL(/\/dashboard/)
}
