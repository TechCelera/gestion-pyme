import { describe, expect, it } from 'vitest'
import {
  sumProjectedCashFlowForPeriod,
  sumRealCashFlowForPeriod,
} from '@/lib/reports/cash-flow-period'

describe('sumRealCashFlowForPeriod', () => {
  const monthlyTrend = [
    { month: '2026-01', inflow: 100, outflow: 40, net: 60 },
    { month: '2026-02', inflow: 200, outflow: 80, net: 120 },
    { month: '2026-03', inflow: 300, outflow: 120, net: 180 },
  ]

  it('suma un solo mes cuando el período es mensual', () => {
    const start = new Date(2026, 1, 1)
    const end = new Date(2026, 1, 28)

    expect(sumRealCashFlowForPeriod(monthlyTrend, start, end)).toEqual({
      inflow: 200,
      outflow: 80,
      net: 120,
    })
  })

  it('suma varios meses cuando el período es trimestral', () => {
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 2, 31)

    expect(sumRealCashFlowForPeriod(monthlyTrend, start, end)).toEqual({
      inflow: 600,
      outflow: 240,
      net: 360,
    })
  })
})

describe('sumProjectedCashFlowForPeriod', () => {
  const rows = [
    { type: 'income', amount: 500, status: 'pending', date: '2026-02-10' },
    { type: 'expense', amount: 150, status: 'pending', date: '2026-02-20' },
    { type: 'income', amount: 900, status: 'approved', date: '2026-02-25' },
    { type: 'income', amount: 300, status: 'pending', date: '2026-04-01' },
  ]

  it('solo incluye pendientes dentro del rango', () => {
    expect(sumProjectedCashFlowForPeriod(rows, '2026-02-01', '2026-02-28')).toEqual({
      inflow: 500,
      outflow: 150,
      net: 350,
    })
  })
})
