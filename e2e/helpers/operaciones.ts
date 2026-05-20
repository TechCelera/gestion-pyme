import { expect, test, type Locator, type Page } from '@playwright/test'

export type GuidedOperationButton = 'Venta' | 'Cobro' | 'Compra' | 'Pago'

export function uniqueE2eLabel(prefix: string): string {
  return `${prefix} ${Date.now()}`
}

/** Falla el test con skip si la empresa no tiene cuentas operativas. */
export async function requireOperationalAccounts(page: Page): Promise<void> {
  await page.goto('/cuentas')
  await expect(page.getByRole('heading', { name: /mis cuentas/i })).toBeVisible({
    timeout: 30_000,
  })
  const hasTable = await page.getByRole('table').isVisible().catch(() => false)
  const hasRows = hasTable && (await page.getByRole('row').count()) > 1
  test.skip(
    !hasRows,
    'Empresa E2E sin cuentas: entrá al dashboard o creá al menos una cuenta en /cuentas'
  )
}

export async function gotoOperaciones(page: Page): Promise<void> {
  await page.goto('/operaciones')
  await expect(page.getByRole('heading', { name: /movimientos/i }).first()).toBeVisible({
    timeout: 30_000,
  })
}

export function movementSheet(page: Page): Locator {
  return page.locator('[data-slot=sheet-content]')
}

export async function openGuidedOperation(
  page: Page,
  operation: GuidedOperationButton
): Promise<void> {
  await gotoOperaciones(page)
  await page.getByRole('button', { name: new RegExp(`^${operation}$`, 'i') }).click()
  const sheet = movementSheet(page)
  await expect(sheet).toBeVisible({ timeout: 15_000 })
}

export async function expectGuidedTitle(page: Page, title: RegExp): Promise<void> {
  await expect(movementSheet(page).getByRole('heading', { name: title })).toBeVisible({
    timeout: 15_000,
  })
}

export async function fillGuidedAmount(page: Page, amount: string): Promise<void> {
  const input = movementSheet(page).locator('#amount-guided')
  await input.click()
  await input.fill('')
  await input.pressSequentially(amount, { delay: 40 })
  await input.press('Tab')
  await expect
    .poll(async () => (await input.inputValue()).replace(/\D/g, ''))
    .toContain(amount.replace(/\D/g, ''))
}

export async function waitGuidedFormReady(page: Page): Promise<void> {
  const sheet = movementSheet(page)
  await expect(sheet.locator('#amount-guided')).toBeVisible({ timeout: 30_000 })
  await expect(sheet.locator('#date-guided')).toBeVisible()
  await expect(sheet.locator('#amount-guided')).toBeEnabled({ timeout: 30_000 })
}

export async function ensureSingleAccountMode(page: Page): Promise<void> {
  const sheet = movementSheet(page)
  const singleBtn = sheet
    .getByRole('button', { name: /^en una cuenta$/i })
    .or(sheet.getByRole('button', { name: /^de una cuenta$/i }))
  if (await singleBtn.isVisible().catch(() => false)) {
    await singleBtn.click()
  }
}

function guidedAccountTrigger(page: Page): Locator {
  return movementSheet(page).locator('#account-guided')
}

/** Prefiere cuenta banco para evitar reglas de fecha en efectivo (general). */
export async function pickGuidedBankAccount(page: Page): Promise<string> {
  await page.keyboard.press('Escape')
  await ensureSingleAccountMode(page)
  const trigger = guidedAccountTrigger(page)
  await expect(trigger).toBeVisible({ timeout: 20_000 })
  await expect(trigger).toBeEnabled({ timeout: 20_000 })
  await trigger.click()
  const listbox = page.getByRole('listbox').last()
  const bankOption = listbox
    .getByRole('option')
    .filter({ hasNotText: /caja/i })
    .first()
  if (await bankOption.isVisible().catch(() => false)) {
    const label = (await bankOption.textContent())?.trim() ?? ''
    await bankOption.click()
    return label
  }
  await page.keyboard.press('Escape')
  return pickComboboxFirstOption(page, 'account-guided')
}

export async function pickComboboxFirstOption(page: Page, triggerId: string): Promise<string> {
  const sheet = movementSheet(page)
  const trigger = sheet.locator(`#${triggerId}`)
  await trigger.click()
  const listbox = page.getByRole('listbox').last()
  const option = listbox.getByRole('option').first()
  await expect(option).toBeVisible({ timeout: 10_000 })
  const label = (await option.textContent())?.trim() ?? ''
  await option.click()
  await expect(listbox).toBeHidden({ timeout: 5_000 }).catch(() => {})
  return label
}

export async function pickComboboxOptionByPattern(
  page: Page,
  triggerId: string,
  pattern: RegExp
): Promise<void> {
  const sheet = movementSheet(page)
  await sheet.locator(`#${triggerId}`).click()
  const option = page.getByRole('option', { name: pattern }).first()
  await expect(option).toBeVisible({ timeout: 10_000 })
  await option.click()
}

export async function openQuickContactFromGuided(page: Page): Promise<void> {
  const sheet = movementSheet(page)
  const createBtn = sheet
    .getByRole('button', { name: /\+ nuevo/i })
    .or(sheet.getByRole('button', { name: /crear cliente/i }))
    .or(sheet.getByRole('button', { name: /crear proveedor/i }))
  await expect(createBtn.first()).toBeVisible({ timeout: 10_000 })
  await createBtn.first().click()
  await expect(page.getByRole('dialog', { name: /nuevo contacto/i })).toBeVisible()
}

export async function saveQuickContactDialog(page: Page, name: string): Promise<void> {
  const dialog = page.getByRole('dialog', { name: /nuevo contacto/i })
  await dialog.getByPlaceholder(/nombre o razón social/i).fill(name)
  await dialog.getByRole('button', { name: /crear contacto/i }).click()
  await expect(dialog).toBeHidden({ timeout: 15_000 })
}

/** Tras crear contacto inline, asegura que quede elegido en el combobox. */
export async function ensureGuidedContactSelected(page: Page, name: string): Promise<void> {
  const trigger = movementSheet(page).locator('#contact-guided')
  const current = (await trigger.textContent()) ?? ''
  if (current.includes(name)) return

  await trigger.click()
  const option = page.getByRole('option', { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
  await expect(option).toBeVisible({ timeout: 10_000 })
  await option.click()
  await expect(trigger).toContainText(name, { timeout: 5_000 })
}

export async function expectToast(page: Page, text: RegExp): Promise<void> {
  await expect(page.locator('[data-sonner-toast]').filter({ hasText: text }).first()).toBeVisible({
    timeout: 20_000,
  })
}

export async function assertGuidedIncomeExpenseReady(
  page: Page,
  opts: { contactName?: string; requireCategory?: boolean }
): Promise<void> {
  const sheet = movementSheet(page)
  if (opts.contactName) {
    await expect(sheet.locator('#contact-guided')).toContainText(opts.contactName)
    await expect(sheet.locator('#contact-guided')).not.toContainText(/elegí contacto/i)
  }
  if (opts.requireCategory) {
    await expect(sheet.locator('#category-guided')).not.toContainText(/elige categoría/i)
  }
  await expect(guidedAccountTrigger(page)).not.toContainText(/elige cuenta/i)
  const digits = (await sheet.locator('#amount-guided').inputValue()).replace(/\D/g, '')
  expect(digits.length).toBeGreaterThan(0)

  await expect(sheet.getByRole('button', { name: /enviar a aprobación/i })).toBeEnabled({
    timeout: 10_000,
  })
}

export async function submitMovementDraft(page: Page): Promise<void> {
  const sheet = movementSheet(page)
  const draftBtn = sheet.getByRole('button', { name: /^borrador$/i })
  await expect(draftBtn).toBeEnabled({ timeout: 10_000 })

  const rpcResponse = page.waitForResponse(
    (res) =>
      res.request().method() === 'POST' &&
      res.url().includes('/rest/v1/rpc/') &&
      (res.url().includes('create_transaction') || res.url().includes('set_operation_components')),
    { timeout: 60_000 }
  )

  await draftBtn.click()

  const validationToast = page.locator('[data-sonner-toast]').first()
  const outcome = await Promise.race([
    rpcResponse.then((res) => ({ kind: 'rpc' as const, res })),
    validationToast
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(async () => ({ kind: 'toast' as const, text: await validationToast.textContent() })),
  ])

  if (outcome.kind === 'toast') {
    throw new Error(`Validación en cliente: ${outcome.text?.trim() ?? 'toast sin texto'}`)
  }

  if (!outcome.res.ok()) {
    const body = await outcome.res.text()
    throw new Error(`RPC falló (${outcome.res.status()}): ${body.slice(0, 500)}`)
  }

  await expect(sheet).toBeHidden({ timeout: 20_000 })
}

export async function expandGuidedScopeOptions(page: Page): Promise<void> {
  await movementSheet(page)
    .getByRole('button', { name: /proyecto o anticipo/i })
    .click()
}
