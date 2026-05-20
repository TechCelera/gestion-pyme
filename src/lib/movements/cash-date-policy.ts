import { format, subDays } from 'date-fns'
import type { MovementComponentType } from '@/lib/validations/movement'

/** Zona horaria de referencia para reglas operativas de fecha (Argentina piloto). */
export const MOVEMENT_CASH_DATE_TIMEZONE = 'America/Argentina/Buenos_Aires'

export type MovementScope = 'general' | 'project'

export type CashComponentInput = {
  componentType: MovementComponentType | string
  accountId?: string | null
}

export type AccountTypeHint = { id: string; type: string }

function calendarDateInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function todayCalendarDate(timeZone = MOVEMENT_CASH_DATE_TIMEZONE): string {
  return calendarDateInTimezone(new Date(), timeZone)
}

export function yesterdayCalendarDate(timeZone = MOVEMENT_CASH_DATE_TIMEZONE): string {
  const todayStr = todayCalendarDate(timeZone)
  const [y, m, d] = todayStr.split('-').map(Number)
  const localToday = new Date(y, m - 1, d)
  return format(subDays(localToday, 1), 'yyyy-MM-dd')
}

export function movementHasCashComponent(input: {
  showPaymentSplit: boolean
  componentLines: CashComponentInput[]
  accountId?: string
  accounts: AccountTypeHint[]
}): boolean {
  if (input.showPaymentSplit) {
    return input.componentLines.some((line) => line.componentType === 'operative_cash')
  }
  if (!input.accountId) return false
  const account = input.accounts.find((a) => a.id === input.accountId)
  return account?.type === 'cash'
}

export function cashDateBoundsForGeneralScope(
  scope: MovementScope,
  hasCash: boolean,
  timeZone = MOVEMENT_CASH_DATE_TIMEZONE
): { min: string; max: string } | null {
  if (scope !== 'general' || !hasCash) return null
  return {
    min: yesterdayCalendarDate(timeZone),
    max: todayCalendarDate(timeZone),
  }
}

export function isDateAllowedForCashInGeneral(
  date: Date | string,
  scope: MovementScope,
  hasCash: boolean,
  timeZone = MOVEMENT_CASH_DATE_TIMEZONE
): boolean {
  const bounds = cashDateBoundsForGeneralScope(scope, hasCash, timeZone)
  if (!bounds) return true

  const dateStr =
    typeof date === 'string'
      ? date.slice(0, 10)
      : format(date, 'yyyy-MM-dd')

  return dateStr >= bounds.min && dateStr <= bounds.max
}

export const CASH_DATE_GENERAL_ERROR_MESSAGE =
  'Con efectivo en General empresa solo podés registrar hoy o ayer.'
