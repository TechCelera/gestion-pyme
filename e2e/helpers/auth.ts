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
  await page.getByLabel(/^email$/i).fill(email)
  await page.getByLabel(/^contraseña$/i).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 })
  await expect(page).toHaveURL(/\/dashboard/)
}
