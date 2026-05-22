import { test, expect } from '@playwright/test'

import { hasE2eCredentials, hasSupabasePublicEnv } from '../helpers/auth'
import {
  expandGuidedScopeOptions,
  assertGuidedIncomeExpenseReady,
  ensureGuidedContactSelected,
  expectGuidedTitle,
  fillGuidedAmount,
  movementSheet,
  openGuidedOperation,
  openQuickContactFromGuided,
  pickComboboxFirstOption,
  pickGuidedBankAccount,
  pickGuidedCashAccountIfAny,
  ensureE2eOperacionesFixtures,
  saveQuickContactDialog,
  submitMovementDraft,
  submitMovementToApproval,
  uniqueE2eLabel,
  waitGuidedFormReady,
} from '../helpers/operaciones'

test.describe('operaciones — flujos guiados (mutan datos)', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasSupabasePublicEnv() || !hasE2eCredentials(),
      'Requiere NEXT_PUBLIC_SUPABASE_* y E2E_TEST_EMAIL / E2E_TEST_PASSWORD'
    )
    await ensureE2eOperacionesFixtures(page)
  })

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
    await movementSheet(page).getByRole('button', { name: /^cancelar$/i }).click()
    await expect(movementSheet(page)).toBeHidden()
  })

  test('cobro: guarda borrador con cliente y cuenta', async ({ page }) => {
    const contactName = uniqueE2eLabel('E2E Cliente')

    await openGuidedOperation(page, 'Cobro')
    await expectGuidedTitle(page, /registrar cobro/i)

    await waitGuidedFormReady(page)
    await openQuickContactFromGuided(page)
    await saveQuickContactDialog(page, contactName)
    await ensureGuidedContactSelected(page, contactName)

    await pickGuidedBankAccount(page)
    await fillGuidedAmount(page, '2500')
    await assertGuidedIncomeExpenseReady(page, { contactName, submit: 'draft' })

    await submitMovementDraft(page)
  })

  test('cobro: envía a aprobación (pendiente) con cliente y cuenta', async ({ page }) => {
    const contactName = uniqueE2eLabel('E2E Cliente Pending')

    await openGuidedOperation(page, 'Cobro')
    await waitGuidedFormReady(page)
    await openQuickContactFromGuided(page)
    await saveQuickContactDialog(page, contactName)
    await ensureGuidedContactSelected(page, contactName)

    await pickGuidedBankAccount(page)
    await fillGuidedAmount(page, '3300')
    await assertGuidedIncomeExpenseReady(page, { contactName, submit: 'primary' })

    await submitMovementToApproval(page)
  })

  test('pago: crea proveedor inline y guarda borrador', async ({ page }) => {
    const contactName = uniqueE2eLabel('E2E Proveedor')

    await openGuidedOperation(page, 'Pago')
    await expectGuidedTitle(page, /registrar pago/i)

    await waitGuidedFormReady(page)
    await openQuickContactFromGuided(page)
    await saveQuickContactDialog(page, contactName)
    await ensureGuidedContactSelected(page, contactName)

    await pickGuidedBankAccount(page)
    await fillGuidedAmount(page, '1800')
    await assertGuidedIncomeExpenseReady(page, { contactName, submit: 'draft' })

    await submitMovementDraft(page)
  })

  test('venta: categoría, cuenta y borrador', async ({ page }) => {
    await openGuidedOperation(page, 'Venta')
    await expectGuidedTitle(page, /registrar venta/i)

    await waitGuidedFormReady(page)
    await pickGuidedBankAccount(page)
    await fillGuidedAmount(page, '3200')
    await pickComboboxFirstOption(page, 'category-guided')
    await assertGuidedIncomeExpenseReady(page, { requireCategory: true, submit: 'draft' })

    await submitMovementDraft(page)
  })

  test('compra: categoría, cuenta y borrador', async ({ page }) => {
    await openGuidedOperation(page, 'Compra')
    await expectGuidedTitle(page, /registrar compra/i)

    await waitGuidedFormReady(page)
    await pickGuidedBankAccount(page)
    await fillGuidedAmount(page, '900')
    await pickComboboxFirstOption(page, 'category-guided')
    await assertGuidedIncomeExpenseReady(page, { requireCategory: true, submit: 'draft' })

    await submitMovementDraft(page)
  })

  test('cobro en general con caja limita fecha a hoy o ayer', async ({ page }) => {
    await openGuidedOperation(page, 'Cobro')
    await waitGuidedFormReady(page)
    await expandGuidedScopeOptions(page)

    const sheet = movementSheet(page)
    await sheet.locator('#guided-scope').click()
    const scopeListbox = page.getByRole('listbox').filter({
      has: page.getByRole('option', { name: /general empresa/i }),
    })
    await scopeListbox.getByRole('option', { name: /general empresa/i }).click()
    await page.keyboard.press('Escape')
    await waitGuidedFormReady(page)

    const hasCash = await pickGuidedCashAccountIfAny(page)
    expect(hasCash, 'Tras seed E2E debe existir cuenta Caja').toBe(true)

    await fillGuidedAmount(page, '5000')

    const dateInput = sheet.locator('#date-guided')
    const min = await dateInput.getAttribute('min')
    const max = await dateInput.getAttribute('max')
    expect(min).toBeTruthy()
    expect(max).toBeTruthy()
    expect(min! <= max!).toBe(true)

    await expect(sheet.getByText(/solo podés elegir hoy o ayer/i)).toBeVisible()
  })
})
