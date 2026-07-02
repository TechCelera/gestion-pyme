import { expect, type Locator, type Page } from '@playwright/test'

import {
  getMoneyFractionDigits,
  moneyInputToNumber,
  parseMoneyInputToCanonical,
} from '@/lib/utils/money-input'

export type GuidedOperationButton = 'Venta' | 'Cobro' | 'Compra' | 'Pago'

export function uniqueE2eLabel(prefix: string): string {
  return `${prefix} ${Date.now()}`
}

async function countTableDataRows(page: Page): Promise<number> {
  const tbody = page.locator('table tbody tr')
  if (!(await page.locator('table tbody').isVisible().catch(() => false))) return 0
  return tbody.count()
}

/** undefined = listado aún cargando */
async function resolveCuentasRowCount(page: Page): Promise<number | undefined> {
  const rows = await countTableDataRows(page)
  if (rows > 0) return rows
  const loader = page.locator('[data-slot=card-content] .animate-spin').first()
  if (await loader.isVisible().catch(() => false)) return undefined
  if (await page.getByText(/todavía no tienes cuentas/i).isVisible().catch(() => false)) {
    return 0
  }
  return 0
}

/** undefined = listado aún cargando */
async function resolveCategoryRowCount(page: Page): Promise<number | undefined> {
  const rows = await countTableDataRows(page)
  if (rows > 0) return rows
  const loader = page.locator('[data-slot=card-content] .animate-spin').first()
  if (await loader.isVisible().catch(() => false)) return undefined
  return 0
}

async function visitCuentasAndResolve(page: Page): Promise<number | undefined> {
  await page.goto('/cuentas')
  await expect(page.getByRole('heading', { name: /mis cuentas/i })).toBeVisible({
    timeout: 15_000,
  })
  return resolveCuentasRowCount(page)
}

async function pollOperationalAccountRows(page: Page): Promise<number> {
  const resolved = await visitCuentasAndResolve(page)
  return resolved ?? 0
}

/** Espera filas en /cuentas sin volver a navegar (evita reiniciar el fetch en cada poll). */
async function waitForAtLeastOneOperationalAccount(page: Page, timeoutMs = 45_000): Promise<void> {
  await expect
    .poll(async () => {
      const resolved = await resolveCuentasRowCount(page)
      if (resolved === undefined || resolved < 1) return undefined
      return resolved
    }, { timeout: timeoutMs, intervals: [500, 1000, 1500] })
    .toBeGreaterThan(0)
}

/** Espera filas en /categorias sin volver a navegar. */
async function waitForAtLeastOneCategory(page: Page, timeoutMs = 30_000): Promise<void> {
  await expect
    .poll(async () => {
      const resolved = await resolveCategoryRowCount(page)
      if (resolved === undefined || resolved < 1) return undefined
      return resolved
    }, { timeout: timeoutMs, intervals: [500, 1000, 1500] })
    .toBeGreaterThan(0)
}

async function createAccountViaUi(
  page: Page,
  spec: { name: string; typeLabel: RegExp }
): Promise<void> {
  await page.goto('/cuentas')
  await expect(page.getByRole('heading', { name: /mis cuentas/i })).toBeVisible({
    timeout: 30_000,
  })
  const newBtn = page.getByRole('button', { name: /nueva cuenta/i })
  await expect(newBtn).toBeVisible({ timeout: 15_000 })
  await expect(newBtn).toBeEnabled()
  await newBtn.click()
  const sheet = page
    .locator('[data-slot=sheet-content]')
    .filter({ has: page.getByRole('heading', { name: /nueva cuenta/i }) })
  await expect(sheet).toBeVisible()
  await sheet.locator('#accountName').fill(spec.name)
  await sheet.locator('#accountType').click()
  const typeListbox = page.getByRole('listbox').last()
  const typeOption = typeListbox.getByRole('option', { name: spec.typeLabel })
  await expect(typeOption).toBeVisible({ timeout: 10_000 })
  await typeOption.click()
  await sheet.getByRole('button', { name: /crear cuenta/i }).click()
  const errorToast = page.locator('[data-sonner-toast]').filter({ hasText: /error|ya existe/i })
  const successToast = page.locator('[data-sonner-toast]').filter({ hasText: /cuenta creada exitosamente/i })
  await Promise.race([
    successToast.first().waitFor({ state: 'visible', timeout: 25_000 }),
    errorToast.first().waitFor({ state: 'visible', timeout: 25_000 }).then(async () => {
      const msg = (await errorToast.first().textContent())?.trim() ?? 'Error al crear cuenta'
      throw new Error(`E2E createAccount: ${msg}`)
    }),
  ])
  await expect(sheet).toBeHidden({ timeout: 10_000 })
}

let e2eFixturesReady = false

async function cuentasTableHasCashRow(page: Page): Promise<boolean> {
  return (await page.locator('table tbody tr').filter({ hasText: /\bcaja\b/i }).count()) > 0
}

/** Caja hace falta para cobro/pago en general (límite de fecha). */
async function ensureCashAccountViaUi(page: Page): Promise<void> {
  await page.goto('/cuentas')
  await expect(page.getByRole('heading', { name: /mis cuentas/i })).toBeVisible({
    timeout: 20_000,
  })
  if (await cuentasTableHasCashRow(page)) return

  await createAccountViaUi(page, {
    name: uniqueE2eLabel('E2E Caja'),
    typeLabel: /^efectivo$/i,
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /mis cuentas/i })).toBeVisible({
    timeout: 15_000,
  })
}

/** Espera seed del dashboard o crea Caja + banco mínimos; nunca hace skip. */
export async function ensureE2eOperacionesFixtures(page: Page): Promise<void> {
  if (e2eFixturesReady) {
    await ensureCashAccountViaUi(page)
    if ((await pollOperationalAccountRows(page)) > 0) return
    e2eFixturesReady = false
  }

  await page.goto('/dashboard')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})

  await page.goto('/cuentas')
  await expect(page.getByRole('heading', { name: /mis cuentas/i })).toBeVisible({
    timeout: 20_000,
  })

  let createdAccountViaUi = false
  try {
    await waitForAtLeastOneOperationalAccount(page, 35_000)
  } catch {
    await createAccountViaUi(page, {
      name: uniqueE2eLabel('E2E Banco'),
      typeLabel: /^bancaria$/i,
    })
    createdAccountViaUi = true
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /mis cuentas/i })).toBeVisible({
      timeout: 15_000,
    })
    await waitForAtLeastOneOperationalAccount(page, 20_000).catch(() => {})
  }

  await ensureCashAccountViaUi(page)
  let accountRows = await resolveCuentasRowCount(page)
  if ((accountRows ?? 0) < 1) {
    await createAccountViaUi(page, {
      name: uniqueE2eLabel('E2E Banco'),
      typeLabel: /^bancaria$/i,
    })
    createdAccountViaUi = true
    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForAtLeastOneOperationalAccount(page, 20_000).catch(() => {})
    accountRows = await resolveCuentasRowCount(page)
  }

  if ((accountRows ?? 0) < 1 && !createdAccountViaUi) {
    throw new Error('E2E: no hay cuentas operativas tras seed/creación')
  }
  if ((accountRows ?? 0) < 1 && createdAccountViaUi) {
    // Toast confirmó alta; el listado puede ir lento en dev.
    await page.reload({ waitUntil: 'domcontentloaded' })
  }

  await page.goto('/dashboard')
  await page.waitForLoadState('domcontentloaded')
  await page.goto('/categorias')
  await expect(page.getByRole('heading', { name: /categorías/i })).toBeVisible({
    timeout: 20_000,
  })

  let createdCategoryViaUi = false
  try {
    await waitForAtLeastOneCategory(page, 30_000)
  } catch {
    const newCatBtn = page.getByRole('button', { name: /nueva categoría/i })
    await expect(newCatBtn).toBeVisible({ timeout: 15_000 })
    await newCatBtn.click()
    const sheet = page
      .locator('[data-slot=sheet-content]')
      .filter({ has: page.getByRole('heading', { name: /nueva categoría/i }) })
    await sheet.locator('#categoryName').fill(uniqueE2eLabel('E2E Ingreso'))
    await sheet.getByRole('button', { name: /crear categoría/i }).click()
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /categoría creada exitosamente/i })
    ).toBeVisible({ timeout: 25_000 })
    await expect(sheet).toBeHidden({ timeout: 10_000 })
    createdCategoryViaUi = true
    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForAtLeastOneCategory(page, 20_000).catch(() => {})
  }

  const categoryRows = await resolveCategoryRowCount(page)
  if ((categoryRows ?? 0) < 1 && !createdCategoryViaUi) {
    throw new Error('E2E: no hay categorías tras seed/creación')
  }

  e2eFixturesReady = true
}

/** @deprecated Usar ensureE2eOperacionesFixtures */
export async function requireOperationalAccounts(page: Page): Promise<void> {
  await ensureE2eOperacionesFixtures(page)
}

export async function gotoOperaciones(page: Page): Promise<void> {
  await page.goto('/operaciones')
  await expect(page.getByRole('heading', { name: /movimientos/i }).first()).toBeVisible({
    timeout: 30_000,
  })
}

export function movementSheet(page: Page): Locator {
  return page.locator('[data-slot=sheet-content]').filter({
    has: page.getByRole('heading', { name: /registrar (venta|cobro|compra|pago)/i }),
  })
}

/** Cierra listbox abierto sin disparar Escape en el sheet (Escape cierra el drawer). */
export async function dismissOpenListbox(page: Page): Promise<void> {
  const listbox = page.getByRole('listbox')
  if (await listbox.first().isVisible().catch(() => false)) {
    await page.locator('body').click({ position: { x: 8, y: 8 } })
    await expect(listbox.first()).toBeHidden({ timeout: 5_000 }).catch(() => {})
  }
}

/** Cierra «Proyecto o anticipo» si tapa los selects del formulario guiado. */
async function collapseGuidedScopePanel(page: Page): Promise<void> {
  const sheet = movementSheet(page)
  const scopePanel = sheet.locator('section.rounded-lg.border-border\\/80')
  if (await scopePanel.isVisible().catch(() => false)) {
    await sheet.getByRole('button', { name: /proyecto o anticipo/i }).click()
    await expect(scopePanel).toBeHidden({ timeout: 5_000 }).catch(() => {})
  }
}

/** Listbox de cuentas (opciones con moneda entre paréntesis). */
function accountOptionsListbox(page: Page) {
  return page.getByRole('listbox').filter({
    has: page.getByRole('option', { name: /\([A-Z]{3}\)/ }),
  })
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

function amountDigitsToCanonical(digits: string, fractionDigits: number): string {
  const intPart = digits.replace(/\D/g, '')
  if (!intPart) return ''
  if (fractionDigits === 0) return intPart
  return `${intPart}.${'0'.repeat(fractionDigits)}`
}

async function readGuidedSheetCurrency(page: Page): Promise<string> {
  const sheet = movementSheet(page)
  const fromAttr = await sheet.getAttribute('data-e2e-operating-currency')
  if (fromAttr?.trim()) return fromAttr.trim()

  const accountText = (await sheet.locator('#account-guided').textContent().catch(() => '')) ?? ''
  const fromAccount = accountText.match(/\(([A-Z]{3})\)\s*$/)
  if (fromAccount?.[1]) return fromAccount[1]

  const totalBlock = sheet
    .locator('p')
    .filter({ hasText: /^total del movimiento$/i })
    .locator('..')
  const text = (await totalBlock.textContent().catch(() => '')) ?? ''
  const fromTotal = text.match(/\b(ARS|COP|USD|EUR)\b/)
  return fromTotal?.[1] ?? 'ARS'
}

function guidedTotalAmountLine(page: Page) {
  return movementSheet(page)
    .locator('p')
    .filter({ hasText: /^total del movimiento$/i })
    .locator('..')
    .locator('p.tabular-nums.font-semibold')
}

function parseGuidedTotalAmount(totalText: string, fractionDigits: number): number {
  const withoutCurrency = totalText.replace(/\s*(ARS|COP|USD|EUR)\s*$/i, '').trim()
  const canonical = parseMoneyInputToCanonical(withoutCurrency, fractionDigits)
  return moneyInputToNumber(canonical)
}

/** Setea monto de la primera fila vía evento (ver movement-friendly-payment-breakdown). */
async function setGuidedPaymentAmountCanonical(page: Page, canonical: string): Promise<void> {
  await movementSheet(page).locator('#amount-guided').waitFor({ state: 'visible', timeout: 15_000 })
  await page.evaluate((value) => {
    window.dispatchEvent(
      new CustomEvent('gestion-pyme:e2e-set-guided-payment-amount', {
        detail: { rowIndex: 0, canonical: value },
      })
    )
  }, canonical)
}

export async function fillGuidedAmount(page: Page, amount: string): Promise<void> {
  const currency = await readGuidedSheetCurrency(page)
  const fractionDigits = getMoneyFractionDigits(currency)
  const expected = Number(amount.replace(/\D/g, ''))
  const canonical = amountDigitsToCanonical(amount, fractionDigits)

  await setGuidedPaymentAmountCanonical(page, canonical)

  await expect
    .poll(async () => {
      const text = (await guidedTotalAmountLine(page).textContent()) ?? ''
      return parseGuidedTotalAmount(text, fractionDigits)
    }, { timeout: 15_000 })
    .toBe(expected)

  const input = movementSheet(page).locator('#amount-guided')
  const inputCanonical = parseMoneyInputToCanonical(
    (await input.inputValue()) ?? '',
    fractionDigits
  )
  expect(moneyInputToNumber(inputCanonical)).toBe(expected)
}

export async function waitGuidedFormReady(page: Page): Promise<void> {
  const sheet = movementSheet(page)
  await expect(sheet.locator('#amount-guided')).toBeVisible({ timeout: 30_000 })
  await expect(sheet.locator('#date-guided')).toBeVisible()
  await expect(sheet.locator('#amount-guided')).toBeEnabled({ timeout: 30_000 })
}

/** Cobro/pago: una cuenta por defecto. Venta/compra: botones «En una cuenta» si el split estaba abierto. */
export async function ensureSingleAccountMode(page: Page): Promise<void> {
  const sheet = movementSheet(page)
  const singleBtn = sheet
    .getByRole('button', { name: /^en una cuenta$/i })
    .or(sheet.getByRole('button', { name: /^de una cuenta$/i }))
    .or(sheet.getByRole('button', { name: /^usar una sola cuenta$/i }))
  if (await singleBtn.isVisible().catch(() => false)) {
    await singleBtn.click()
  }
}

/** Elige una cuenta banco (no Caja ni cuenta corriente) en la primera fila. */
export async function pickGuidedBankAccount(page: Page): Promise<string> {
  await dismissOpenListbox(page)
  await collapseGuidedScopePanel(page)
  const sheet = movementSheet(page)
  await expect(sheet).toBeVisible({ timeout: 10_000 })
  const trigger = sheet.locator('#account-guided')
  await expect(trigger).toBeVisible({ timeout: 20_000 })
  await expect(trigger).toBeEnabled({ timeout: 20_000 })
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()
  const listbox = accountOptionsListbox(page)
  await expect(listbox).toBeVisible({ timeout: 10_000 })
  const bankOption = listbox
    .getByRole('option')
    .filter({ hasNotText: /caja/i })
    .filter({ hasNotText: /cuenta corriente/i })
    .first()
  if ((await bankOption.count()) < 1) {
    throw new Error(
      'E2E: no hay cuenta bancaria operativa en el desglose (creá una cuenta tipo bancaria)'
    )
  }
  await expect(bankOption).toBeVisible({ timeout: 10_000 })
  const label = (await bankOption.textContent())?.trim() ?? ''
  await bankOption.click({ force: true })
  await dismissOpenListbox(page)
  return label
}

/** Elige Caja en el select unificado de cuenta (primera fila). */
export async function pickGuidedCashAccountIfAny(page: Page): Promise<boolean> {
  await dismissOpenListbox(page)
  await collapseGuidedScopePanel(page)
  const sheet = movementSheet(page)
  await expect(sheet).toBeVisible({ timeout: 10_000 })
  const trigger = sheet.locator('#account-guided')
  try {
    await expect(trigger).toBeVisible({ timeout: 20_000 })
    await expect(trigger).toBeEnabled({ timeout: 20_000 })
    await expect(trigger).not.toContainText(/creá cuentas en configuración/i, {
      timeout: 15_000,
    })
  } catch {
    return false
  }

  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()

  const listbox = page.getByRole('listbox').and(page.locator(':visible')).last()
  try {
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    const cashOption = listbox.getByRole('option', { name: /caja/i }).first()
    await expect(cashOption).toBeVisible({ timeout: 10_000 })
    await cashOption.click({ force: true })
  } catch {
    await dismissOpenListbox(page)
    return false
  }

  await dismissOpenListbox(page)
  return true
}

export async function pickComboboxFirstOption(page: Page, triggerId: string): Promise<string> {
  const sheet = movementSheet(page)
  await collapseGuidedScopePanel(page)
  const trigger = sheet.locator(`#${triggerId}`)
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()
  const listbox = page.getByRole('listbox').and(page.locator(':visible')).last()
  const option = listbox.getByRole('option').first()
  await expect(option).toBeVisible({ timeout: 10_000 })
  const label = (await option.textContent())?.trim() ?? ''
  await option.click({ force: true })
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
  await expect(createBtn.first()).toBeEnabled({ timeout: 30_000 })
  await createBtn.first().click()
  await expect(page.getByRole('dialog', { name: /nuevo (cliente|proveedor|contacto)/i })).toBeVisible()
}

export async function saveQuickContactDialog(
  page: Page,
  name: string,
  phone = '11 5555-0000'
): Promise<void> {
  const dialog = page.getByRole('dialog', { name: /nuevo (cliente|proveedor|contacto)/i })
  await dialog.getByLabel(/^nombre$/i).fill(name)
  await dialog.getByLabel(/^teléfono$/i).fill(phone)
  await dialog.getByRole('button', { name: /crear (cliente|proveedor|contacto)/i }).click()
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
  opts: {
    contactName?: string
    requireCategory?: boolean
    /** Borrador no exige el botón principal habilitado. */
    submit?: 'draft' | 'primary'
  }
): Promise<void> {
  const sheet = movementSheet(page)
  if (opts.contactName) {
    await expect(sheet.locator('#contact-guided')).toContainText(opts.contactName)
    await expect(sheet.locator('#contact-guided')).not.toContainText(/elegí contacto/i)
  }
  if (opts.requireCategory) {
    await expect(sheet.locator('#category-guided')).not.toContainText(/elige categoría/i)
  }
  await expect(sheet.locator('#account-guided')).not.toContainText(/elige cuenta/i)
  const currency = await readGuidedSheetCurrency(page)
  const fractionDigits = getMoneyFractionDigits(currency)
  const totalAmount = parseGuidedTotalAmount(
    (await guidedTotalAmountLine(page).textContent()) ?? '',
    fractionDigits
  )
  expect(totalAmount).toBeGreaterThan(0)

  const submitTarget = opts.submit ?? 'primary'
  const submitBtn =
    submitTarget === 'draft'
      ? sheet.getByRole('button', { name: /^borrador$/i })
      : guidedPrimarySubmitButton(sheet)
  await expect(submitBtn).toBeEnabled({ timeout: 15_000 })
}

/** Botón principal del formulario guiado (enviar o registrar cobro/pago/venta/compra). */
export function guidedPrimarySubmitButton(sheet: ReturnType<typeof movementSheet>) {
  return sheet.getByRole('button', {
    name: /^(enviar a aprobación|registrar (cobro|pago|venta|compra))$/i,
  })
}

const MOVEMENT_ERROR_TOAST =
  /error|no se pudo|inválid|obligatorio|elegí|escribe el|revisa el desglose|validación/i

async function waitForMovementSubmitOutcome(
  page: Page,
  sheet: Locator,
  successPattern: RegExp
): Promise<void> {
  const errorToast = page.locator('[data-sonner-toast]').filter({ hasText: MOVEMENT_ERROR_TOAST })

  await Promise.race([
    page
      .locator('[data-sonner-toast]')
      .filter({ hasText: successPattern })
      .last()
      .waitFor({ state: 'visible', timeout: 45_000 }),
    errorToast
      .last()
      .waitFor({ state: 'visible', timeout: 45_000 })
      .then(async () => {
        const text = (await errorToast.last().textContent())?.trim() ?? ''
        throw new Error(`Validación en cliente: ${text}`)
      }),
  ])

  await expect(sheet).toBeHidden({ timeout: 20_000 })
}

export async function submitMovementDraft(page: Page): Promise<void> {
  const sheet = movementSheet(page)
  const draftBtn = sheet.getByRole('button', { name: /^borrador$/i })
  await expect(draftBtn).toBeEnabled({ timeout: 10_000 })
  await draftBtn.click()
  await waitForMovementSubmitOutcome(
    page,
    sheet,
    /guardado como borrador|borrador actualizado/i
  )
}

/** Crea el movimiento y lo envía a pendiente (no borrador). */
export async function submitMovementToApproval(page: Page): Promise<void> {
  const sheet = movementSheet(page)
  const primaryBtn = guidedPrimarySubmitButton(sheet)
  await expect(primaryBtn).toBeEnabled({ timeout: 10_000 })
  await primaryBtn.click()
  await waitForMovementSubmitOutcome(
    page,
    sheet,
    /enviado a aprobación|movimiento actualizado|aprobado y registrado/i
  )
}

export async function expandGuidedScopeOptions(page: Page): Promise<void> {
  await movementSheet(page)
    .getByRole('button', { name: /proyecto o anticipo/i })
    .click()
}
