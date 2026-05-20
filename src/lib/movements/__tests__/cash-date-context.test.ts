import { describe, expect, it } from 'vitest'
import { buildCashDateContext, clampDateToBounds } from '../cash-date-context'
import {
  todayCalendarDate,
  yesterdayCalendarDate,
} from '../cash-date-policy'

describe('cash-date-context', () => {
  it('arma bounds e isAllowed para efectivo en general', () => {
    const ctx = buildCashDateContext({
      movementScope: 'general',
      showPaymentSplit: false,
      componentLines: [],
      accountId: 'caja',
      accounts: [{ id: 'caja', type: 'cash' }],
      date: todayCalendarDate(),
    })
    expect(ctx.hasCash).toBe(true)
    expect(ctx.bounds).toEqual({
      min: yesterdayCalendarDate(),
      max: todayCalendarDate(),
    })
    expect(ctx.isAllowed).toBe(true)
    expect(
      buildCashDateContext({
        movementScope: 'general',
        showPaymentSplit: false,
        componentLines: [],
        accountId: 'caja',
        accounts: [{ id: 'caja', type: 'cash' }],
        date: '2020-01-01',
      }).isAllowed
    ).toBe(false)
  })

  it('clampDateToBounds acota al máximo permitido', () => {
    const bounds = { min: yesterdayCalendarDate(), max: todayCalendarDate() }
    expect(clampDateToBounds('2099-01-01', bounds)).toBe(bounds.max)
    expect(clampDateToBounds(bounds.min, bounds)).toBe(bounds.min)
    expect(clampDateToBounds('2020-01-01', null)).toBe('2020-01-01')
  })
})
