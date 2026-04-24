'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from './kpi-card'
import { TrendingUp, ArrowDownRight, DollarSign, BarChart3, PieChart, Target, Activity, Wallet } from 'lucide-react'
import type { DashboardStats } from '@/lib/actions/transactions'

interface RealDashboardProps {
  stats: DashboardStats
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function RealDashboard({ stats }: RealDashboardProps) {
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
          title="Transacciones"
          value={String(stats.totalTransactions)}
          icon={Wallet}
          gradient="from-[#FF9F43] to-[#FF6B6B]"
        />
      </div>

      {/* Placeholder Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PlaceholderChartCard
          icon={BarChart3}
          title="Estado de Resultados"
          subtitle="Gráfico de ingresos y gastos mensuales"
          gradient="from-[#7B68EE] to-[#00C9FF]"
        />
        <PlaceholderChartCard
          icon={PieChart}
          title="Distribución de Gastos"
          subtitle="Desglose por categoría"
          gradient="from-[#FF6B6B] to-[#FFE66D]"
        />
        <PlaceholderChartCard
          icon={Target}
          title="Performance Radar"
          subtitle="Indicadores clave vs metas"
          gradient="from-[#00C9FF] to-[#92FE9D]"
        />
        <PlaceholderChartCard
          icon={Activity}
          title="Flujo de Caja"
          subtitle="Entradas vs salidas por día"
          gradient="from-[#FF9F43] to-[#FF6B6B]"
        />
      </div>
    </div>
  )
}

function PlaceholderChartCard({
  icon: Icon,
  title,
  subtitle,
  gradient,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  gradient: string
}) {
  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div>{title}</div>
            <div className="text-sm font-normal text-muted-foreground">{subtitle}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
          <BarChart3 className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">Gráficos disponibles próximamente</p>
          <p className="text-xs mt-1">Estamos construyendo los reportes visuales</p>
        </div>
      </CardContent>
    </Card>
  )
}
