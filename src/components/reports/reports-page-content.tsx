'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, BarChart3, TrendingUp, Scale } from 'lucide-react'
import { getReportsData } from '@/lib/actions/movements'
import { ReportsCharts } from '@/components/reports/reports-charts'
import { ReportsPageFallback } from '@/components/reports/reports-page-fallback'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ReportMetricRow,
  ReportMetricRows,
  ReportMetricSection,
} from '@/components/reports/report-metric-rows'
import { cn } from '@/lib/utils'
import { CashFlowMonthlyTrend } from '@/components/reports/cash-flow-monthly-trend'
import { ReportsPeriodTabs } from '@/components/reports/reports-period-tabs'
import { useCompanyOperatingCurrency } from '@/hooks/use-company-operating-currency'
import { DistribuidoraResultsCard } from '@/components/distribuidora/distribuidora-results-card'
import { computeDistribuidoraResults } from '@/lib/distribuidora/distribuidora-results'
import type { CompanyOperatingProfile } from '@/lib/company-operating-profile'
import { DISTRIBUIDORA_REPORTS_PERIOD_PRESETS } from '@/lib/utils/reports-period'
import { formatReportCurrency } from '@/lib/reports/format'

export function ReportsPageContent({
  rango,
  isDistribuidora = false,
  canViewFinancialResults = true,
  operatingProfile = 'default',
}: {
  rango?: string
  isDistribuidora?: boolean
  canViewFinancialResults?: boolean
  operatingProfile?: CompanyOperatingProfile
}) {
  return (
    <ReportsPageInner
      key={rango ?? 'mes'}
      rango={rango}
      isDistribuidora={isDistribuidora}
      canViewFinancialResults={canViewFinancialResults}
      operatingProfile={operatingProfile}
    />
  )
}

function ReportsPageInner({
  rango,
  isDistribuidora,
  canViewFinancialResults,
  operatingProfile,
}: {
  rango: string | undefined
  isDistribuidora: boolean
  canViewFinancialResults: boolean
  operatingProfile: CompanyOperatingProfile
}) {
  const { currency } = useCompanyOperatingCurrency(true)
  const reportMoney = (amount: number) => formatReportCurrency(amount, currency)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Awaited<ReturnType<typeof getReportsData>>['data']>(undefined)

  useEffect(() => {
    let cancelled = false

    void getReportsData(rango, { operatingProfile }).then((result) => {
      if (cancelled) return
      if (!result.success || !result.data) {
        setError(result.error ?? 'Error desconocido')
        setData(undefined)
      } else {
        setData(result.data)
        setError(null)
      }
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [rango, operatingProfile])

  if (isLoading) {
    return <ReportsPageFallback />
  }

  if (error || !data) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <PageHeader title="Reportes" description="Genera y visualiza reportes financieros" />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-700">No se pudieron cargar los reportes</p>
              <p className="text-sm text-red-600">{error ?? 'Error desconocido'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { incomeStatement, cashFlow, balanceSheet, rangeKey } = data
  const distribuidoraResults = isDistribuidora
    ? computeDistribuidoraResults(incomeStatement.totalIncome, incomeStatement.expenseBreakdown)
    : null

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        title="Reportes"
        description={
          canViewFinancialResults
            ? `Estado de resultados, balance y flujo de caja · ${incomeStatement.periodLabel}`
            : `Flujo de caja operativo · ${incomeStatement.periodLabel}`
        }
      />

      <ReportsPeriodTabs
        value={rangeKey}
        basePath="/reportes"
        presets={isDistribuidora ? DISTRIBUIDORA_REPORTS_PERIOD_PRESETS : undefined}
      />

      {isDistribuidora && canViewFinancialResults && distribuidoraResults ? (
        <DistribuidoraResultsCard
          periodLabel={incomeStatement.periodLabel}
          results={distribuidoraResults}
          currency={currency}
        />
      ) : null}

      <div className="space-y-4 lg:space-y-6">
        {canViewFinancialResults ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 md:items-stretch">
            <Card size="sm" className="min-w-0 flex h-full flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 shrink-0 text-primary" />
                  Estado de Resultados
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {incomeStatement.periodLabel} · movimientos aprobados
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col pt-0">
                <ReportMetricRows>
                  <ReportMetricRow
                    label="Ingresos"
                    value={reportMoney(incomeStatement.totalIncome)}
                    valueClassName="font-medium text-green-600"
                  />
                  <ReportMetricRow
                    label="Gastos"
                    value={reportMoney(incomeStatement.totalExpenses)}
                    valueClassName="font-medium text-red-600"
                  />
                  <ReportMetricRow
                    label="Utilidad neta"
                    value={reportMoney(incomeStatement.netProfit)}
                    emphasize
                    valueClassName={cn(
                      'font-semibold',
                      incomeStatement.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  />
                  <ReportMetricRow
                    label="Margen"
                    value={`${incomeStatement.marginPercent.toFixed(2)}%`}
                    valueClassName="font-medium"
                  />
                </ReportMetricRows>

                <ReportMetricSection title="Top gastos por categoría">
                  {incomeStatement.expenseBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin gastos en el período.</p>
                  ) : (
                    <ReportMetricRows>
                      {incomeStatement.expenseBreakdown.map((item) => (
                        <ReportMetricRow
                          key={item.category}
                          label={item.category}
                          value={reportMoney(item.amount)}
                          valueClassName="font-medium"
                        />
                      ))}
                    </ReportMetricRows>
                  )}
                </ReportMetricSection>
              </CardContent>
            </Card>

            <Card size="sm" className="min-w-0 flex h-full flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="h-5 w-5 shrink-0 text-primary" />
                  Balance (diario)
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Posición al {balanceSheet.asOf} · cierre del período seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col pt-0">
                <ReportMetricRows>
                  <ReportMetricRow
                    label="Activos"
                    value={reportMoney(balanceSheet.totalAssets)}
                    valueClassName="font-medium"
                  />
                  <ReportMetricRow
                    label="Pasivos"
                    value={reportMoney(balanceSheet.totalLiabilities)}
                    valueClassName="font-medium"
                  />
                  <ReportMetricRow
                    label="Patrimonio"
                    value={reportMoney(balanceSheet.totalEquity)}
                    valueClassName="font-medium"
                  />
                </ReportMetricRows>

                <ReportMetricSection title="Cuadre contable">
                  <ReportMetricRows>
                    <ReportMetricRow
                      label="Activos − Pasivos − Patrimonio"
                      value={reportMoney(
                        balanceSheet.totalAssets -
                          balanceSheet.totalLiabilities -
                          balanceSheet.totalEquity
                      )}
                      valueClassName="font-medium text-muted-foreground"
                    />
                  </ReportMetricRows>
                </ReportMetricSection>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
              Flujo de caja
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Totales del período · {cashFlow.periodLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
            <div className="rounded-lg border border-green-200/70 bg-green-50/60 p-3 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">
                Real (caja y banco · aprobadas)
              </p>
              <ReportMetricRows className="divide-green-200/50">
                <ReportMetricRow
                  label="Entradas"
                  value={reportMoney(cashFlow.cashInReal)}
                  valueClassName="font-medium text-green-600"
                />
                <ReportMetricRow
                  label="Salidas"
                  value={reportMoney(cashFlow.cashOutReal)}
                  valueClassName="font-medium text-red-600"
                />
                <ReportMetricRow
                  label="Flujo neto"
                  value={reportMoney(cashFlow.netCashFlowReal)}
                  emphasize
                  valueClassName={cn(
                    'font-semibold',
                    cashFlow.netCashFlowReal >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                />
              </ReportMetricRows>
            </div>

            <div className="rounded-lg border border-blue-200/70 bg-blue-50/60 p-3 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-2">
                Proyectado (pendientes de aprobación)
              </p>
              <ReportMetricRows className="divide-blue-200/50">
                <ReportMetricRow
                  label="Entradas"
                  value={reportMoney(cashFlow.cashInProjected)}
                  valueClassName="font-medium text-green-600"
                />
                <ReportMetricRow
                  label="Salidas"
                  value={reportMoney(cashFlow.cashOutProjected)}
                  valueClassName="font-medium text-red-600"
                />
                <ReportMetricRow
                  label="Flujo neto"
                  value={reportMoney(cashFlow.netCashFlowProjected)}
                  emphasize
                  valueClassName={cn(
                    'font-semibold',
                    cashFlow.netCashFlowProjected >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                />
              </ReportMetricRows>
            </div>
          </CardContent>
        </Card>
      </div>

      {canViewFinancialResults ? (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tendencia últimos 6 meses</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Ventana fija de 6 meses hasta el cierre del período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-w-0">
              <CashFlowMonthlyTrend
                title="Real (aprobadas)"
                items={cashFlow.monthlyTrend}
                currency={currency}
              />
              <CashFlowMonthlyTrend
                title="Proyectado (pendientes de aprobación)"
                items={cashFlow.monthlyTrendProjected}
                currency={currency}
              />
            </CardContent>
          </Card>

          <ReportsCharts data={data} currency={currency} />
        </>
      ) : null}
    </div>
  )
}
