import { test, expect } from '@playwright/test'

import { hasE2eCredentials, hasSupabasePublicEnv } from '../helpers/auth'
import {
  expandGuidedScopeOptions,
  assertGuidedIncomeExpenseReady,
  ensureGuidedContactSelected,
  ensureSingleAccountMode,
  expectGuidedTitle,
  fillGuidedAmount,
  movementSheet,
  openGuidedOperation,
  openQuickContactFromGuided,
  pickComboboxFirstOption,
  pickGuidedBankAccount,
  requireOperationalAccounts,
  saveQuickContactDialog,
  submitMovementDraft,
  uniqueE2eLabel,
  waitGuidedFormReady,
} from '../helpers/operaciones'

test.describe('operaciones — flujos guiados (mutan datos)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasSupabasePublicEnv() || !hasE2eCredentials(),
      'Requiere NEXT_PUBLIC_SUPABASE_* y E2E_TEST_EMAIL / E2E_TEST_PASSWORD'
    )
    // Repone cuentas/categorías mínimas si la BD de prueba está vacía.
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  })

  test.describe.configure({ mode: 'serial' })

  test('abre formularios de venta, cobro, compra y pago', async ({ page }) => {
    await openGuidedOperation(page, 'Venta')
    await expectGuidedTitle(page, /registrar venta/i)
    await movementSheet(page).getByRole('button', { name: /^cancelar$/i }).click()
    await expect(movementSheet(page)).toBeHidden()

    await openGuidedOperation(page, 'Cobro')
    await expectGuidedTitle(page, /registrar cobro/i)
    await movementSheet(page).getByRole('button', { name: /^cancelar$/i }).click()

    await openGuidedOperation(page, 'Compra')
    await expectGuidedTitle(page, /registrar compra/i)
    await movementSheet(page).getByRole('button', { name: /^cancelar$/i }).click()

    await openGuidedOperation(page, 'Pago')
    await expectGuidedTitle(page, /registrar pago/i)
  })

  test('cobro: crea cliente inline desde el select', async ({ page }) => {
    const contactName = uniqueE2eLabel('E2E Cliente')

    await openGuidedOperation(page, 'Cobro')
    await waitGuidedFormReady(page)
    await openQuickContactFromGuided(page)
    await saveQuickContactDialog(page, contactName)
    await ensureGuidedContactSelected(page, contactName)
    await expect(movementSheet(page).locator('#contact-guided')).toContainText(contactName)
  })

  test('cobro: guarda borrador con cliente y cuenta', async ({ page }) => {
    await requireOperationalAccounts(page)
    const contactName = uniqueE2eLabel('E2E Cliente')

    await openGuidedOperation(page, 'Cobro')
    await expectGuidedTitle(page, /registrar cobro/i)

    await waitGuidedFormReady(page)
    await openQuickContactFromGuided(page)
    await saveQuickContactDialog(page, contactName)
    await ensureGuidedContactSelected(page, contactName)
    await ensureSingleAccountMode(page)

    await fillGuidedAmount(page, '2500')
    await pickGuidedBankAccount(page)
    await assertGuidedIncomeExpenseReady(page, { contactName })

    await submitMovementDraft(page)
  })

  test('pago: crea proveedor inline y guarda borrador', async ({ page }) => {
    await requireOperationalAccounts(page)
    const contactName = uniqueE2eLabel('E2E Proveedor')

    await openGuidedOperation(page, 'Pago')
    await expectGuidedTitle(page, /registrar pago/i)

    await waitGuidedFormReady(page)
    await openQuickContactFromGuided(page)
    await saveQuickContactDialog(page, contactName)
    await ensureGuidedContactSelected(page, contactName)
    await ensureSingleAccountMode(page)

    await fillGuidedAmount(page, '1800')
    await pickGuidedBankAccount(page)
    await assertGuidedIncomeExpenseReady(page, { contactName })

    await submitMovementDraft(page)
  })

  test('venta: categoría, cuenta y borrador', async ({ page }) => {
    await requireOperationalAccounts(page)
    await openGuidedOperation(page, 'Venta')
    await expectGuidedTitle(page, /registrar venta/i)

    await waitGuidedFormReady(page)
    await fillGuidedAmount(page, '3200')
    await pickGuidedBankAccount(page)
    await pickComboboxFirstOption(page, 'category-guided')
    await assertGuidedIncomeExpenseReady(page, { requireCategory: true })

    await submitMovementDraft(page)
  })

  test('compra: categoría, cuenta y borrador', async ({ page }) => {
    await requireOperationalAccounts(page)
    await openGuidedOperation(page, 'Compra')
    await expectGuidedTitle(page, /registrar compra/i)

    await waitGuidedFormReady(page)
    await fillGuidedAmount(page, '900')
    await pickGuidedBankAccount(page)
    await pickComboboxFirstOption(page, 'category-guided')
    await assertGuidedIncomeExpenseReady(page, { requireCategory: true })

    await submitMovementDraft(page)
  })

  test('cobro en general con caja limita fecha a hoy o ayer', async ({ page }) => {
    await requireOperationalAccounts(page)
    await openGuidedOperation(page, 'Cobro')
    await expandGuidedScopeOptions(page)

    const sheet = movementSheet(page)
    await sheet.locator('#guided-scope').click()
    await page.getByRole('option', { name: /general empresa/i }).click()

    const hasCash = await pickCashAccountIfAny(page)
    test.skip(!hasCash, 'La empresa E2E no tiene cuenta tipo caja')

    const dateInput = sheet.locator('#date-guided')
    const min = await dateInput.getAttribute('min')
    const max = await dateInput.getAttribute('max')
    expect(min).toBeTruthy()
    expect(max).toBeTruthy()
    expect(min! <= max!).toBe(true)

    await expect(sheet.getByText(/solo podés elegir hoy o ayer/i)).toBeVisible()
  })
})

async function pickCashAccountIfAny(page: import('@playwright/test').Page): Promise<boolean> {
  const sheet = movementSheet(page)
  await sheet.locator('#account-guided').click()
  const cashOption = page
    .getByRole('option')
    .filter({ hasText: /caja/i })
    .first()
  const visible = await cashOption.isVisible().catch(() => false)
  if (!visible) {
    await page.keyboard.press('Escape')
    return false
  }
  await cashOption.click()
  return true
}
