'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CashFlowMonthlyTrend } from '@/components/reports/cash-flow-monthly-trend'
import { formatReportCurrency } from '@/lib/reports/format'
import type { ReportsRangeKey } from '@/lib/utils/reports-period'

const PERIOD_LINKS: { key: ReportsRangeKey; label: string; href: string }[] = [
  { key: 'mes', label: 'Este mes', href: '/reportes' },
  { key: 'mes_anterior', label: 'Mes anterior', href: '/reportes?rango=mes_anterior' },
  { key: 'trimestre', label: 'Este trimestre', href: '/reportes?rango=trimestre' },
  { key: 'trim_anterior', label: 'Trimestre anterior', href: '/reportes?rango=trim_anterior' },
]

export function ReportsPageContent({ rango }: { rango?: string }) {
  return <ReportsPageInner key={rango ?? 'mes'} rango={rango} />
}

function ReportsPageInner({ rango }: { rango: string | undefined }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Awaited<ReturnType<typeof getReportsData>>['data']>(undefined)

  useEffect(() => {
    let cancelled = false

    void getReportsData(rango).then((result) => {
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
  }, [rango])

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

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        title="Reportes"
        description={`Estado de resultados, balance y flujo de caja · ${incomeStatement.periodLabel}`}
      />

      <div className="flex flex-wrap gap-2">
        {PERIOD_LINKS.map(({ key, label, href }) => (
          <Button
            key={key}
            variant={rangeKey === key ? 'default' : 'outline'}
            size="sm"
            className={cn(rangeKey === key && 'bg-primary')}
            asChild
          >
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </div>

      <div className="space-y-4 lg:space-y-6">
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
                  value={formatReportCurrency(incomeStatement.totalIncome)}
                  valueClassName="font-medium text-green-600"
                />
                <ReportMetricRow
                  label="Gastos"
                  value={formatReportCurrency(incomeStatement.totalExpenses)}
                  valueClassName="font-medium text-red-600"
                />
                <ReportMetricRow
                  label="Utilidad neta"
                  value={formatReportCurrency(incomeStatement.netProfit)}
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
                        value={formatReportCurrency(item.amount)}
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
                  value={formatReportCurrency(balanceSheet.totalAssets)}
                  valueClassName="font-medium"
                />
                <ReportMetricRow
                  label="Pasivos"
                  value={formatReportCurrency(balanceSheet.totalLiabilities)}
                  valueClassName="font-medium"
                />
                <ReportMetricRow
                  label="Patrimonio"
                  value={formatReportCurrency(balanceSheet.totalEquity)}
                  valueClassName="font-medium"
                />
              </ReportMetricRows>

              <ReportMetricSection title="Cuadre contable">
                <ReportMetricRows>
                  <ReportMetricRow
                    label="Activos − Pasivos − Patrimonio"
                    value={formatReportCurrency(
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
                  value={formatReportCurrency(cashFlow.cashInReal)}
                  valueClassName="font-medium text-green-600"
                />
                <ReportMetricRow
                  label="Salidas"
                  value={formatReportCurrency(cashFlow.cashOutReal)}
                  valueClassName="font-medium text-red-600"
                />
                <ReportMetricRow
                  label="Flujo neto"
                  value={formatReportCurrency(cashFlow.netCashFlowReal)}
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
                  value={formatReportCurrency(cashFlow.cashInProjected)}
                  valueClassName="font-medium text-green-600"
                />
                <ReportMetricRow
                  label="Salidas"
                  value={formatReportCurrency(cashFlow.cashOutProjected)}
                  valueClassName="font-medium text-red-600"
                />
                <ReportMetricRow
                  label="Flujo neto"
                  value={formatReportCurrency(cashFlow.netCashFlowProjected)}
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tendencia últimos 6 meses</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Ventana fija de 6 meses hasta el cierre del período seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-w-0">
          <CashFlowMonthlyTrend title="Real (aprobadas)" items={cashFlow.monthlyTrend} />
          <CashFlowMonthlyTrend
            title="Proyectado (pendientes de aprobación)"
            items={cashFlow.monthlyTrendProjected}
          />
        </CardContent>
      </Card>

      <ReportsCharts data={data} />
    </div>
  )
}
