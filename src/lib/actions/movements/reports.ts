'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/types'
import { requireAuthenticatedContext } from '@/lib/auth/server-context'
import { isAdminRole } from '@/lib/auth/roles'
import {
  type CompanyOperatingProfile,
  isDistribuidoraProfile,
  normalizeOperatingProfile,
} from '@/lib/company-operating-profile'
import { errorMessageForUser } from '@/lib/utils/errors'
import {
  sumProjectedCashFlowForPeriod,
  sumRealCashFlowForPeriod,
} from '@/lib/reports/cash-flow-period'
import { formatReportsPeriodLabel, resolveReportsPeriod, type ReportsRangeKey } from '@/lib/utils/reports-period'

export interface IncomeStatementReport {
  periodLabel: string
  totalIncome: number
  totalExpenses: number
  netProfit: number
  marginPercent: number
  expenseBreakdown: Array<{
    category: string
    amount: number
  }>
}

export interface CashFlowReport {
  periodLabel: string
  cashInReal: number
  cashOutReal: number
  netCashFlowReal: number
  cashInProjected: number
  cashOutProjected: number
  netCashFlowProjected: number
  monthlyTrend: Array<{
    month: string
    inflow: number
    outflow: number
    net: number
  }>
  monthlyTrendProjected: Array<{
    month: string
    inflow: number
    outflow: number
    net: number
  }>
}

export interface BalanceSheetReport {
  asOf: string
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
}

export interface ReportsData {
  rangeKey: ReportsRangeKey
  incomeStatement: IncomeStatementReport
  cashFlow: CashFlowReport
  balanceSheet: BalanceSheetReport
}

function numFromJson(v: unknown): number {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const n = Number(String(v))
  return Number.isNaN(n) ? 0 : n
}

export async function getReportsData(
  rangePreset?: string | null,
  options?: { operatingProfile?: CompanyOperatingProfile }
): Promise<ActionResult<ReportsData>> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId, role } = auth

    const supabase = await createClient()
    const { start, end, key: rangeKey } = resolveReportsPeriod(rangePreset)
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    const trendStart = new Date(end.getFullYear(), end.getMonth() - 5, 1)
    const trendStartStr = trendStart.toISOString().split('T')[0]

    const [plRes, cashRes, balRes, trendResult] = await Promise.all([
      supabase.rpc('rpc_reports_income_statement_period', {
        p_company_id: companyId,
        p_from: startStr,
        p_to: endStr,
      }),
      supabase.rpc('rpc_reports_cash_flow_real_monthly', {
        p_company_id: companyId,
        p_from: trendStartStr,
        p_to: endStr,
      }),
      supabase.rpc('rpc_reports_balance_sheet', {
        p_company_id: companyId,
        p_as_of: endStr,
      }),
      supabase
        .from('transactions')
        .select('type, amount, status, date')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .gte('date', trendStartStr)
        .lte('date', endStr),
    ])

    if (plRes.error) {
      return { success: false, error: plRes.error.message }
    }
    if (cashRes.error) {
      return { success: false, error: cashRes.error.message }
    }
    if (balRes.error) {
      return { success: false, error: balRes.error.message }
    }
    if (trendResult.error) {
      return { success: false, error: trendResult.error.message }
    }

    const operatingProfile = normalizeOperatingProfile(options?.operatingProfile)
    const canViewFinancialResults =
      !isDistribuidoraProfile(operatingProfile) || isAdminRole(role)

    const pl = (plRes.data ?? {}) as Record<string, unknown>
    const totalIncome = canViewFinancialResults ? numFromJson(pl.totalIncome) : 0
    const totalExpenses = canViewFinancialResults ? numFromJson(pl.totalExpenses) : 0
    const netProfit = totalIncome - totalExpenses
    const marginPercent =
      canViewFinancialResults && totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    const ebRaw = pl.expenseBreakdown as unknown[] | undefined
    const expenseBreakdown = canViewFinancialResults
      ? (ebRaw ?? []).map((item) => {
          const row = item as Record<string, unknown>
          return {
            category: String(row.category ?? ''),
            amount: numFromJson(row.amount),
          }
        })
      : []

    const bal = (balRes.data ?? {}) as Record<string, unknown>
    const balanceSheet: BalanceSheetReport = {
      asOf: String(bal.asOf ?? endStr),
      totalAssets: canViewFinancialResults ? numFromJson(bal.totalAssets) : 0,
      totalLiabilities: canViewFinancialResults ? numFromJson(bal.totalLiabilities) : 0,
      totalEquity: canViewFinancialResults ? numFromJson(bal.totalEquity) : 0,
    }

    const trendRows = (trendResult.data ?? []) as Array<Record<string, unknown>>

    const monthMapReal = new Map<string, { inflow: number; outflow: number }>()
    const monthMapProjected = new Map<string, { inflow: number; outflow: number }>()
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMapReal.set(key, { inflow: 0, outflow: 0 })
      monthMapProjected.set(key, { inflow: 0, outflow: 0 })
    }

    const cashRows = (cashRes.data ?? []) as Array<Record<string, unknown>>
    for (const row of cashRows) {
      const mk = String(row.month ?? '')
      const slot = monthMapReal.get(mk)
      if (slot) {
        slot.inflow = numFromJson(row.inflow)
        slot.outflow = numFromJson(row.outflow)
      }
    }

    for (const row of trendRows) {
      const date = row.date as string
      const type = row.type as string
      const status = row.status as string
      const amount = Number(row.amount ?? 0)
      if (!date) continue
      const monthKey = date.slice(0, 7)
      const currentProjected = monthMapProjected.get(monthKey)
      if (!currentProjected) continue

      const isIncome = type === 'income'
      const isExpense = type === 'expense'
      if (!isIncome && !isExpense) continue

      // Tras unificar aprobación con asiento: lo aprobado ya entra en el bloque "real" (RPC diario).
      // Proyectado = pipeline operativo pendiente de aprobación (sin duplicar montos contabilizados).
      if (status === 'pending') {
        if (isIncome) currentProjected.inflow += amount
        if (isExpense) currentProjected.outflow += amount
      }
    }

    const monthlyTrend = Array.from(monthMapReal.entries()).map(([month, values]) => ({
      month,
      inflow: values.inflow,
      outflow: values.outflow,
      net: values.inflow - values.outflow,
    }))
    const monthlyTrendProjected = Array.from(monthMapProjected.entries()).map(([month, values]) => ({
      month,
      inflow: values.inflow,
      outflow: values.outflow,
      net: values.inflow - values.outflow,
    }))

    const periodRealCashFlow = sumRealCashFlowForPeriod(monthlyTrend, start, end)
    const periodProjectedCashFlow = sumProjectedCashFlowForPeriod(trendRows, startStr, endStr)

    const periodLabel = formatReportsPeriodLabel(start, end)

    return {
      success: true,
      data: {
        rangeKey,
        incomeStatement: {
          periodLabel,
          totalIncome,
          totalExpenses,
          netProfit,
          marginPercent,
          expenseBreakdown,
        },
        cashFlow: {
          periodLabel,
          cashInReal: periodRealCashFlow.inflow,
          cashOutReal: periodRealCashFlow.outflow,
          netCashFlowReal: periodRealCashFlow.net,
          cashInProjected: periodProjectedCashFlow.inflow,
          cashOutProjected: periodProjectedCashFlow.outflow,
          netCashFlowProjected: periodProjectedCashFlow.net,
          monthlyTrend,
          monthlyTrendProjected,
        },
        balanceSheet,
      },
    }
  } catch (error) {
    return { success: false, error: errorMessageForUser(error) }
  }
}