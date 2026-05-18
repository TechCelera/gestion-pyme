'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, BarChart3, TrendingUp, Scale } from 'lucide-react'
import { getReportsData } from '@/lib/actions/movements'
import { ReportsCharts } from '@/components/reports/reports-charts'
import { ReportsPageFallback } from '@/components/reports/reports-page-fallback'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatReportCurrency, formatReportMonth } from '@/lib/reports/format'
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Estado de Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ingresos</span>
                <span className="font-medium text-green-600">
                  {formatReportCurrency(incomeStatement.totalIncome)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gastos</span>
                <span className="font-medium text-red-600">
                  {formatReportCurrency(incomeStatement.totalExpenses)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-medium">Utilidad Neta</span>
                <span
                  className={`font-semibold ${incomeStatement.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatReportCurrency(incomeStatement.netProfit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Margen</span>
                <span className="font-medium">{incomeStatement.marginPercent.toFixed(2)}%</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Top gastos por categoría</p>
              <div className="space-y-1.5">
                {incomeStatement.expenseBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin gastos registrados en el período.</p>
                ) : (
                  incomeStatement.expenseBreakdown.map((item) => (
                    <div key={item.category} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.category}</span>
                      <span className="font-medium">{formatReportCurrency(item.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Flujo de Caja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm rounded-lg border border-green-200/70 bg-green-50/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Real desde diario (caja/banco · aprobadas)
              </p>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entradas de efectivo</span>
                <span className="font-medium text-green-600">
                  {formatReportCurrency(cashFlow.cashInReal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Salidas de efectivo</span>
                <span className="font-medium text-red-600">
                  {formatReportCurrency(cashFlow.cashOutReal)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-medium">Flujo Neto</span>
                <span
                  className={`font-semibold ${cashFlow.netCashFlowReal >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatReportCurrency(cashFlow.netCashFlowReal)}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm rounded-lg border border-blue-200/70 bg-blue-50/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Proyectado (pendientes de aprobación)
              </p>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entradas de efectivo</span>
                <span className="font-medium text-green-600">
                  {formatReportCurrency(cashFlow.cashInProjected)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Salidas de efectivo</span>
                <span className="font-medium text-red-600">
                  {formatReportCurrency(cashFlow.cashOutProjected)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-medium">Flujo Neto</span>
                <span
                  className={`font-semibold ${cashFlow.netCashFlowProjected >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatReportCurrency(cashFlow.netCashFlowProjected)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Tendencia real últimos 6 meses</p>
              <div className="space-y-1.5">
                {cashFlow.monthlyTrend.map((item) => (
                  <div key={item.month} className="grid grid-cols-4 gap-2 text-xs">
                    <span className="text-muted-foreground">{formatReportMonth(item.month)}</span>
                    <span className="text-green-600 text-right">{formatReportCurrency(item.inflow)}</span>
                    <span className="text-red-600 text-right">{formatReportCurrency(item.outflow)}</span>
                    <span
                      className={`text-right font-medium ${item.net >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatReportCurrency(item.net)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Tendencia proyectada (pendientes) últimos 6 meses</p>
              <div className="space-y-1.5">
                {cashFlow.monthlyTrendProjected.map((item) => (
                  <div key={`projected-${item.month}`} className="grid grid-cols-4 gap-2 text-xs">
                    <span className="text-muted-foreground">{formatReportMonth(item.month)}</span>
                    <span className="text-green-600 text-right">{formatReportCurrency(item.inflow)}</span>
                    <span className="text-red-600 text-right">{formatReportCurrency(item.outflow)}</span>
                    <span
                      className={`text-right font-medium ${item.net >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatReportCurrency(item.net)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Balance (diario)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Posición acumulada hasta el {balanceSheet.asOf} desde el diario (movimientos aprobados).
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Activos</span>
                <span className="font-medium">{formatReportCurrency(balanceSheet.totalAssets)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pasivos</span>
                <span className="font-medium">{formatReportCurrency(balanceSheet.totalLiabilities)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Patrimonio</span>
                <span className="font-medium">{formatReportCurrency(balanceSheet.totalEquity)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ReportsCharts data={data} />
    </div>
  )
}
