'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import type { ReportsData } from '@/lib/actions/transactions'

interface ReportsChartsProps {
  data: ReportsData
}

const PIE_COLORS = ['#7B68EE', '#00C9FF', '#92FE9D', '#FF6B6B', '#FFE66D', '#FF9F43', '#A78BFA', '#34D399']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('es-AR', { month: 'short' })
}

export function ReportsCharts({ data }: ReportsChartsProps) {
  const { incomeStatement, cashFlow } = data

  const incomeVsExpenseData = [
    { name: 'Ingresos', value: incomeStatement.totalIncome },
    { name: 'Gastos', value: incomeStatement.totalExpenses },
    { name: 'Neto', value: incomeStatement.netProfit },
  ]

  const expenseBreakdownData = incomeStatement.expenseBreakdown.map((item) => ({
    name: item.category,
    value: item.amount,
  }))

  const trendData = cashFlow.monthlyTrend.map((item, index) => ({
    month: formatMonth(item.month),
    realIngreso: item.inflow,
    realGasto: item.outflow,
    proyectadoIngreso: cashFlow.monthlyTrendProjected[index]?.inflow ?? 0,
    proyectadoGasto: cashFlow.monthlyTrendProjected[index]?.outflow ?? 0,
  }))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium mb-3">Ingresos vs gastos del período</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeVsExpenseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {incomeVsExpenseData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name === 'Gastos' ? '#FF6B6B' : entry.name === 'Neto' ? '#00C9FF' : '#7B68EE'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium mb-3">Distribución de gastos por categoría</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={expenseBreakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}>
                {expenseBreakdownData.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border p-4 xl:col-span-2">
        <p className="text-sm font-medium mb-3">Tendencia de flujo de caja (6 meses)</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="realIngreso" stroke="#16A34A" strokeWidth={2} name="Ingreso real" />
              <Line type="monotone" dataKey="realGasto" stroke="#DC2626" strokeWidth={2} name="Gasto real" />
              <Line
                type="monotone"
                dataKey="proyectadoIngreso"
                stroke="#22C55E"
                strokeDasharray="6 4"
                strokeWidth={2}
                name="Ingreso proyectado"
              />
              <Line
                type="monotone"
                dataKey="proyectadoGasto"
                stroke="#EF4444"
                strokeDasharray="6 4"
                strokeWidth={2}
                name="Gasto proyectado"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
