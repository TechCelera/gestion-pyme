import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, BarChart3, TrendingUp } from 'lucide-react'
import { getReportsData } from '@/lib/actions/transactions'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
}

export default async function ReportsPage() {
  const result = await getReportsData()

  if (!result.success || !result.data) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Genera y visualiza reportes financieros
          </p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-700">No se pudieron cargar los reportes</p>
              <p className="text-sm text-red-600">{result.error ?? 'Error desconocido'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { incomeStatement, cashFlow } = result.data

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Estado de resultados y flujo de caja de {incomeStatement.periodLabel}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <span className="font-medium text-green-600">{formatCurrency(incomeStatement.totalIncome)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gastos</span>
                <span className="font-medium text-red-600">{formatCurrency(incomeStatement.totalExpenses)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-medium">Utilidad Neta</span>
                <span className={`font-semibold ${incomeStatement.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(incomeStatement.netProfit)}
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
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
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
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entradas de efectivo</span>
                <span className="font-medium text-green-600">{formatCurrency(cashFlow.cashIn)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Salidas de efectivo</span>
                <span className="font-medium text-red-600">{formatCurrency(cashFlow.cashOut)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-medium">Flujo Neto</span>
                <span className={`font-semibold ${cashFlow.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlow.netCashFlow)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Tendencia últimos 6 meses</p>
              <div className="space-y-1.5">
                {cashFlow.monthlyTrend.map((item) => (
                  <div key={item.month} className="grid grid-cols-4 gap-2 text-xs">
                    <span className="text-muted-foreground">{formatMonth(item.month)}</span>
                    <span className="text-green-600 text-right">{formatCurrency(item.inflow)}</span>
                    <span className="text-red-600 text-right">{formatCurrency(item.outflow)}</span>
                    <span className={`text-right font-medium ${item.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.net)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
