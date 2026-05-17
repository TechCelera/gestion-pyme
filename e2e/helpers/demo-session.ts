import { expect, type Page } from '@playwright/test'

export const DEMO_AUTH_STORAGE = {
  state: {
    userId: 'demo-user-001',
    email: 'demo@gestionpyme.com',
    companyId: 'demo-company-001',
    role: 'admin',
    fullName: 'Usuario Demo',
    isAuthenticated: true,
    isDemoMode: true,
  },
  version: 0,
}

const NAV_TIMEOUT = 60_000
const VISIBLE_TIMEOUT = 30_000

function demoCookieDomain(baseURL: string): string {
  return new URL(baseURL).hostname
}

/** Cookie + zustand persist: el SSR de /dashboard y el cliente en /operaciones ven modo demo. */
export async function prepareDemoSession(page: Page, baseURL: string) {
  await page.context().addCookies([
    {
      name: 'demo_mode',
      value: 'true',
      domain: demoCookieDomain(baseURL),
      path: '/',
      sameSite: 'Lax',
    },
  ])

  await page.addInitScript((storage) => {
    window.localStorage.setItem('gestion-pyme-auth', JSON.stringify(storage))
  }, DEMO_AUTH_STORAGE)
}

export async function enterDemoAsGuest(page: Page, baseURL: string) {
  await prepareDemoSession(page, baseURL)
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT })
  await expect(page.getByText(/Estás en modo demo/i)).toBeVisible({ timeout: VISIBLE_TIMEOUT })
}

/** Sesión limpia para probar el botón de login sin estado demo precargado. */
export async function clearDemoSession(page: Page, baseURL: string) {
  await page.context().clearCookies()
  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT })
  await page.evaluate(() => {
    localStorage.removeItem('gestion-pyme-auth')
  })
}
