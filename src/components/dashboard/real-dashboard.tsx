'use client'

import { KpiCard } from './kpi-card'
import { TrendingUp, ArrowDownRight, DollarSign, Wallet } from 'lucide-react'
import { ReportsCharts } from '@/components/reports/reports-charts'
import type { DashboardStats, ReportsData } from '@/lib/actions/operations'

interface RealDashboardProps {
  stats: DashboardStats
  reportsData: ReportsData | null | undefined
  reportsError?: string | null
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function RealDashboard({ stats, reportsData, reportsError }: RealDashboardProps) {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen de la situación de tu empresa</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Ingresos"
          value={formatCurrency(stats.totalIncome)}
          icon={TrendingUp}
          gradient="from-[#7B68EE] to-[#00C9FF]"
        />
        <KpiCard
          title="Gastos"
          value={formatCurrency(stats.totalExpenses)}
          icon={ArrowDownRight}
          gradient="from-[#FF6B6B] to-[#FFE66D]"
        />
        <KpiCard
          title="Balance Neto"
          value={formatCurrency(stats.netBalance)}
          icon={DollarSign}
          gradient="from-[#00C9FF] to-[#92FE9D]"
        />
        <KpiCard
          title="Operaciones"
          value={String(stats.totalOperations)}
          icon={Wallet}
          gradient="from-[#FF9F43] to-[#FF6B6B]"
        />
      </div>

      {reportsData ? (
        <ReportsCharts data={reportsData} />
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            No se pudieron cargar los gráficos del dashboard en este momento.
          </p>
          {reportsError ? (
            <p className="mt-1 text-xs text-red-600">{reportsError}</p>
          ) : null}
          <p className="mt-2 text-xs text-red-600">
            Recarga la página y, si persiste, revisa el módulo de reportes.
          </p>
        </div>
      )}
    </div>
  )
}
