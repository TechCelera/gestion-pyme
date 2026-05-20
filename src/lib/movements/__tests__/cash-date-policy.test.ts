import { describe, expect, it } from 'vitest'
import {
  cashDateBoundsForGeneralScope,
  isDateAllowedForCashInGeneral,
  movementHasCashComponent,
  yesterdayCalendarDate,
  todayCalendarDate,
} from '../cash-date-policy'

describe('cash-date-policy', () => {
  it('detecta efectivo en línea operative_cash', () => {
    expect(
      movementHasCashComponent({
        showPaymentSplit: true,
        componentLines: [{ componentType: 'operative_cash', accountId: 'a' }],
        accountId: '',
        accounts: [],
      })
    ).toBe(true)
  })

  it('detecta efectivo por cuenta tipo cash en modo simple', () => {
    expect(
      movementHasCashComponent({
        showPaymentSplit: false,
        componentLines: [],
        accountId: 'caja-1',
        accounts: [{ id: 'caja-1', type: 'cash' }],
      })
    ).toBe(true)
  })

  it('limita fechas en general con efectivo a hoy y ayer', () => {
    const bounds = cashDateBoundsForGeneralScope('general', true)
    expect(bounds).toEqual({
      min: yesterdayCalendarDate(),
      max: todayCalendarDate(),
    })
    expect(isDateAllowedForCashInGeneral(bounds!.max, 'general', true)).toBe(true)
    expect(isDateAllowedForCashInGeneral(bounds!.min, 'general', true)).toBe(true)
    expect(isDateAllowedForCashInGeneral('2020-01-01', 'general', true)).toBe(false)
  })

  it('no limita fechas en proyecto', () => {
    expect(cashDateBoundsForGeneralScope('project', true)).toBeNull()
    expect(isDateAllowedForCashInGeneral('2020-01-01', 'project', true)).toBe(true)
  })
})
