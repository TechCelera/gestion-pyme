'use client'

import { KpiCard } from './kpi-card'
import { TrendingUp, ArrowDownRight, DollarSign, Wallet, ShieldCheck } from 'lucide-react'
import { ReportsCharts } from '@/components/reports/reports-charts'
import { ChequesDemoCard } from '@/components/distribuidora/cheques-demo-card'
import { DemoBanner } from '@/components/distribuidora/demo-banner'
import { DistribuidoraResultsCard } from '@/components/distribuidora/distribuidora-results-card'
import type { DashboardStats, ReportsData } from '@/lib/actions/movements'
import type { DistribuidoraResults } from '@/lib/distribuidora/distribuidora-results'
import { formatCurrency } from '@/lib/format/currency'

interface RealDashboardProps {
  stats: DashboardStats
  reportsData: ReportsData | null | undefined
  reportsError?: string | null
  currency: string
  isDistribuidora?: boolean
  canViewFinancialResults?: boolean
  distribuidoraToday?: {
    periodLabel: string
    results: DistribuidoraResults
  } | null
}

export function RealDashboard({
  stats,
  reportsData,
  reportsError,
  currency,
  isDistribuidora = false,
  canViewFinancialResults = true,
  distribuidoraToday,
}: RealDashboardProps) {
  const cashFlow = reportsData?.cashFlow

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isDistribuidora ? 'Resumen del día' : 'Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isDistribuidora
            ? 'Administración y finanzas · distribución mayorista'
            : 'Resumen de la situación de tu empresa'}
        </p>
      </div>

      {isDistribuidora ? <DemoBanner /> : null}

      {isDistribuidora && !canViewFinancialResults ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Vista operativa</p>
              <p className="text-sm text-muted-foreground">
                Puedes cargar ventas, compras, gastos, cobros y pagos. Los resultados bruto y neto
                quedan reservados para Matías.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {isDistribuidora && canViewFinancialResults && distribuidoraToday ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DistribuidoraResultsCard
            periodLabel={distribuidoraToday.periodLabel}
            results={distribuidoraToday.results}
            currency={currency}
          />
          <ChequesDemoCard currency={currency} />
        </div>
      ) : null}

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {isDistribuidora && cashFlow ? (
          <>
            <KpiCard
              title="Entradas caja"
              value={formatCurrency(cashFlow.cashInReal, currency)}
              icon={TrendingUp}
              gradient="from-[#7B68EE] to-[#00C9FF]"
            />
            <KpiCard
              title="Salidas caja"
              value={formatCurrency(cashFlow.cashOutReal, currency)}
              icon={ArrowDownRight}
              gradient="from-[#FF6B6B] to-[#FFE66D]"
            />
            <KpiCard
              title="Caja neta"
              value={formatCurrency(cashFlow.netCashFlowReal, currency)}
              icon={DollarSign}
              gradient="from-[#00C9FF] to-[#92FE9D]"
            />
          </>
        ) : (
          <>
            <KpiCard
              title="Ingresos"
              value={formatCurrency(stats.totalIncome, currency)}
              icon={TrendingUp}
              gradient="from-[#7B68EE] to-[#00C9FF]"
            />
            <KpiCard
              title="Gastos"
              value={formatCurrency(stats.totalExpenses, currency)}
              icon={ArrowDownRight}
              gradient="from-[#FF6B6B] to-[#FFE66D]"
            />
            <KpiCard
              title="Balance Neto"
              value={formatCurrency(stats.netBalance, currency)}
              icon={DollarSign}
              gradient="from-[#00C9FF] to-[#92FE9D]"
            />
          </>
        )}
        <KpiCard
          title="Movimientos"
          value={String(stats.totalMovements)}
          icon={Wallet}
          gradient="from-[#FF9F43] to-[#FF6B6B]"
        />
      </div>

      {reportsData && canViewFinancialResults ? (
        <ReportsCharts data={reportsData} currency={currency} />
      ) : !reportsData && canViewFinancialResults ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            No se pudieron cargar los gráficos del dashboard en este momento.
          </p>
          {reportsError ? <p className="mt-1 text-xs text-red-600">{reportsError}</p> : null}
          <p className="mt-2 text-xs text-red-600">
            Recarga la página y, si persiste, revisa el módulo de reportes.
          </p>
        </div>
      ) : null}
    </div>
  )
}
