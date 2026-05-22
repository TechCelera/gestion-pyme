import type { Account } from '@/lib/actions/accounts'
import type { Category } from '@/lib/actions/categories'
import type { ContactRow } from '@/lib/actions/contacts'
import { CASH_DATE_GENERAL_ERROR_MESSAGE } from '@/lib/movements/cash-date-policy'
import type { buildCashDateContext } from '@/lib/movements/cash-date-context'
import { resolveMovementDescription } from '@/lib/movements/form-defaults'
import {
  isCollectionOrPaymentKind,
  isSaleOrPurchaseKind,
} from '@/lib/movements/operation-kind'
import type {
  AdjustmentReason,
  CreateMovementInput,
  MovementComponentRow,
  MovementMethod,
  MovementType,
  OperationKind,
} from '@/lib/validations/movement'
import { moneyInputToNumber } from '@/lib/utils/money-input'
import {
  buildMainComponentLine,
  type ComponentLineDraft,
} from '@/components/movements/movement-form.types'
import {
  isCreditMedium,
  isOperativeMedium,
  normalizeFriendlyPaymentLines,
} from '@/lib/movements/payment-medium'

export type MovementFormSubmitInput = {
  type: MovementType
  operationKind: OperationKind
  movementScope: 'general' | 'project'
  date: string
  amount: string
  currency: string
  description: string
  method: MovementMethod
  accountId: string
  categoryId: string
  contactId: string
  sourceAccountId: string
  destinationAccountId: string
  adjustmentReason: string
  fundOwner: 'company' | 'client_advance'
  projectId: string
  showPaymentSplit: boolean
  componentLines: ComponentLineDraft[]
  effectiveComponentLines: ComponentLineDraft[]
  accounts: Pick<Account, 'id' | 'type'>[]
  categories: Pick<Category, 'id' | 'name'>[]
  contacts: Pick<ContactRow, 'id' | 'name'>[]
  cashDateContext: ReturnType<typeof buildCashDateContext> | null
}

export type MovementFormSubmitResult =
  | { ok: true; data: CreateMovementInput }
  | { ok: false; message: string }

export function resolvePrimaryAccountId(
  rows: MovementComponentRow[],
  fallbackAccountId: string
): string {
  const operative = rows.find(
    (c) =>
      (c.componentType === 'operative_cash' || c.componentType === 'operative_bank') &&
      c.accountId
  )
  return operative?.accountId ?? fallbackAccountId
}

export function buildMovementComponentsFromDrafts(input: {
  effectiveComponentLines: ComponentLineDraft[]
  amount: string
  currency: string
  mainContactId?: string
}): MovementComponentRow[] {
  const total = moneyInputToNumber(input.amount)
  const rows: MovementComponentRow[] = []

  for (const line of input.effectiveComponentLines) {
    const amt = moneyInputToNumber(line.amount)
    if (!line.amount.trim() || Number.isNaN(amt) || amt <= 0) continue

    const isOperative =
      line.componentType === 'operative_cash' || line.componentType === 'operative_bank'

    if (isOperative && !line.accountId) continue
    const contactId = isOperative ? '' : line.contactId || input.mainContactId || ''
    if (!isOperative && !contactId) continue

    rows.push({
      componentType: line.componentType,
      accountId: isOperative ? line.accountId : undefined,
      contactId: isOperative ? undefined : contactId,
      amount: amt,
      currency: input.currency,
    })
  }

  const sum = rows.reduce((acc, row) => acc + row.amount, 0)
  if (rows.length === 0 || Math.round(sum * 100) !== Math.round(total * 100)) {
    return []
  }

  return rows
}

export function buildEffectiveComponentLines(input: {
  type: MovementType
  operationKind?: OperationKind | null
  showPaymentSplit: boolean
  componentLines: ComponentLineDraft[]
  accountId: string
  amount: string
  accounts: Pick<Account, 'id' | 'type'>[]
}): ComponentLineDraft[] {
  if (input.type !== 'income' && input.type !== 'expense') {
    return input.componentLines
  }
  if (input.showPaymentSplit || isCollectionOrPaymentKind(input.operationKind)) {
    return normalizeFriendlyPaymentLines(input.componentLines, input.accounts)
  }
  return [buildMainComponentLine(input.accountId, input.amount, input.accounts)]
}

export function usesLineBasedAccounts(input: {
  type: MovementType
  operationKind?: OperationKind | null
  showPaymentSplit: boolean
}): boolean {
  if (input.type === 'income' || input.type === 'expense') return true
  return isCollectionOrPaymentKind(input.operationKind) || input.showPaymentSplit
}

export function validateAndBuildMovementPayload(
  input: MovementFormSubmitInput
): MovementFormSubmitResult {
  const parsedAmount = moneyInputToNumber(input.amount)
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return { ok: false, message: 'Indica un monto mayor a cero' }
  }

  const lineBased =
    (input.type === 'income' || input.type === 'expense') &&
    usesLineBasedAccounts({
      type: input.type,
      operationKind: input.operationKind,
      showPaymentSplit: input.showPaymentSplit,
    })

  if (input.type === 'income' || input.type === 'expense') {
    if (!lineBased && !input.accountId) {
      return { ok: false, message: 'Elige la cuenta' }
    }
    if (isSaleOrPurchaseKind(input.operationKind) && !input.categoryId) {
      return { ok: false, message: 'Elige una categoría' }
    }
    if (isCollectionOrPaymentKind(input.operationKind) && !input.contactId) {
      return { ok: false, message: 'Elige el contacto para cobros y pagos' }
    }
    if (input.cashDateContext && !input.cashDateContext.isAllowed) {
      return { ok: false, message: CASH_DATE_GENERAL_ERROR_MESSAGE }
    }
  }

  const categoryName = input.categories.find((c) => c.id === input.categoryId)?.name
  const contactName = input.contacts.find((c) => c.id === input.contactId)?.name
  const finalDescription = resolveMovementDescription({
    type: input.type,
    operationKind: input.operationKind,
    description: input.description,
    categoryName,
    contactName,
  })

  if (input.type !== 'transfer' && finalDescription.trim().length < 3) {
    const fallbackHint = isCollectionOrPaymentKind(input.operationKind)
      ? 'elige un contacto'
      : isSaleOrPurchaseKind(input.operationKind)
        ? 'elige una categoría'
        : 'elige una categoría o escribe una nota'
    return {
      ok: false,
      message: `Escribe una nota de al menos 3 caracteres o ${fallbackHint}`,
    }
  }

  let movementComponents: MovementComponentRow[] | undefined
  let resolvedAccountId = input.accountId

  if (input.type === 'income' || input.type === 'expense') {
    const built = buildMovementComponentsFromDrafts({
      effectiveComponentLines: input.effectiveComponentLines,
      amount: input.amount,
      currency: input.currency,
      mainContactId: input.contactId,
    })

    if (!built.length) {
      if (lineBased) {
        const movementKind = input.type === 'income' ? 'income' : 'expense'
        const missingAccount = input.effectiveComponentLines.some((line) => {
          const amt = moneyInputToNumber(line.amount)
          if (!line.amount.trim() || Number.isNaN(amt) || amt <= 0) return false
          if (!isOperativeMedium(line.componentType)) return false
          return !line.accountId
        })
        const missingContact = input.effectiveComponentLines.some((line) => {
          const amt = moneyInputToNumber(line.amount)
          if (!line.amount.trim() || Number.isNaN(amt) || amt <= 0) return false
          if (!isCreditMedium(line.componentType, movementKind)) return false
          const contactId =
            line.contactId ||
            (isCollectionOrPaymentKind(input.operationKind) ? input.contactId : '')
          return !contactId
        })
        if (missingAccount) {
          return {
            ok: false,
            message: 'En cada fila de efectivo o transferencia, elegí la cuenta',
          }
        }
        if (missingContact) {
          return {
            ok: false,
            message: isCollectionOrPaymentKind(input.operationKind)
              ? 'En cuenta corriente, usá el contacto del formulario o elegí quién'
              : 'En cada fila de cuenta corriente, elegí quién debe o debe',
          }
        }
        return {
          ok: false,
          message: 'La suma de las líneas debe coincidir con el monto total',
        }
      }
      return { ok: false, message: 'Indica un monto y una cuenta válidos' }
    }

    movementComponents = built
    resolvedAccountId = resolvePrimaryAccountId(built, input.accountId)
    if (!resolvedAccountId) {
      return {
        ok: false,
        message: 'Indicá al menos una línea con cuenta de efectivo o banco',
      }
    }
  }

  const data: CreateMovementInput = {
    type: input.type,
    operationKind: input.operationKind,
    movementScope: input.movementScope,
    date: new Date(input.date),
    amount: parsedAmount,
    currency: input.currency,
    description: finalDescription,
    method: input.method,
    ...(input.type === 'income' || input.type === 'expense'
      ? {
          accountId: resolvedAccountId,
          categoryId: isSaleOrPurchaseKind(input.operationKind)
            ? input.categoryId || undefined
            : undefined,
          contactId: isCollectionOrPaymentKind(input.operationKind)
            ? input.contactId
            : undefined,
          contactType: isCollectionOrPaymentKind(input.operationKind)
            ? input.operationKind === 'collection'
              ? 'cliente'
              : 'proveedor'
            : undefined,
          movementComponents,
        }
      : {}),
    ...(input.type === 'transfer'
      ? {
          sourceAccountId: input.sourceAccountId,
          destinationAccountId: input.destinationAccountId,
        }
      : {}),
    ...(input.type === 'adjustment'
      ? {
          accountId: input.accountId,
          adjustmentReason: input.adjustmentReason as AdjustmentReason,
        }
      : {}),
    fundOwner: input.fundOwner,
    projectId: input.movementScope === 'project' ? input.projectId || undefined : undefined,
  }

  return { ok: true, data }
}
