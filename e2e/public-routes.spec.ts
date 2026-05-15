import { test, expect } from '@playwright/test'

test.describe('rutas públicas', () => {
  test('login carga y muestra acceso demo', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText(/Gestion PYME/i).first()).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Entrar como Invitado \(Demo\)/i })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Iniciar Sesión/i })).toBeVisible()
  })

  test('registro carga', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Crea tu cuenta y empresa')).toBeVisible()
  })
})
