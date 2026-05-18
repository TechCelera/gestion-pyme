import { test, expect } from '@playwright/test'

test.describe('rutas públicas', () => {
  test('login carga con formulario de acceso', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText(/Gestion PYME/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Iniciar Sesión/i })).toBeVisible()
    await expect(page.getByLabel(/correo|email/i)).toBeVisible()
  })

  test('registro carga', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Crea tu cuenta y empresa')).toBeVisible()
    await expect(page.getByLabel(/confirmar contraseña/i)).toBeVisible()
    await expect(page.getByLabel(/nombre de la empresa/i)).toBeVisible()
    await expect(page.getByText(/términos de uso/i)).toBeVisible()
  })
})
