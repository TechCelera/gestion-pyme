import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportsCharts } from '@/components/reports/reports-charts'
import type { ReportsData } from '@/lib/actions/movements'

const emptyReportsData: ReportsData = {
  rangeKey: 'mes',
  incomeStatement: {
    periodLabel: 'Este mes',
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    marginPercent: 0,
    expenseBreakdown: [],
  },
  cashFlow: {
    periodLabel: 'Este mes',
    cashInReal: 0,
    cashOutReal: 0,
    netCashFlowReal: 0,
    cashInProjected: 0,
    cashOutProjected: 0,
    netCashFlowProjected: 0,
    monthlyTrend: [
      { month: '2026-01', inflow: 0, outflow: 0, net: 0 },
      { month: '2026-02', inflow: 0, outflow: 0, net: 0 },
    ],
    monthlyTrendProjected: [
      { month: '2026-01', inflow: 0, outflow: 0, net: 0 },
      { month: '2026-02', inflow: 0, outflow: 0, net: 0 },
    ],
  },
  balanceSheet: {
    asOf: '2026-05-17',
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
  },
}

describe('ReportsCharts', () => {
  it('shows empty state messages when there is no chart data', () => {
    render(<ReportsCharts data={emptyReportsData} />)

    expect(screen.getByText('Sin ingresos ni gastos en el período')).toBeInTheDocument()
    expect(screen.getByText('No hay gastos por categoría')).toBeInTheDocument()
    expect(screen.getByText('Sin movimientos de caja en los últimos meses')).toBeInTheDocument()
  })
})
