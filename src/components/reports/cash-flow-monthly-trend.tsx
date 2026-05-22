import { formatReportCurrency, formatReportMonth } from '@/lib/reports/format'
import { cn } from '@/lib/utils'

export type CashFlowMonthRow = {
  month: string
  inflow: number
  outflow: number
  net: number
}

type CashFlowMonthlyTrendProps = {
  title: string
  items: CashFlowMonthRow[]
  currency: string
  emptyMessage?: string
}

export function CashFlowMonthlyTrend({
  title,
  items,
  currency,
  emptyMessage = 'Sin datos en el período.',
}: CashFlowMonthlyTrendProps) {
  const formatAmount = (value: number) => formatReportCurrency(value, currency)
  if (items.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 min-w-0">
      <p className="text-sm font-medium">{title}</p>

      <div className="space-y-2 sm:hidden">
        {items.map((item) => (
          <div
            key={item.month}
            className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 space-y-2"
          >
            <p className="text-sm font-medium capitalize">{formatReportMonth(item.month)}</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Entradas</span>
                <span className="font-medium text-green-600 tabular-nums text-right">
                  {formatAmount(item.inflow)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Salidas</span>
                <span className="font-medium text-red-600 tabular-nums text-right">
                  {formatAmount(item.outflow)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-border/60 pt-1.5">
                <span className="font-medium">Neto</span>
                <span
                  className={cn(
                    'font-semibold tabular-nums text-right',
                    item.net >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {formatAmount(item.net)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block -mx-1 overflow-x-auto">
        <table className="w-full min-w-[22rem] text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border/80">
              <th className="text-left font-medium pb-2 pr-3 whitespace-nowrap">Mes</th>
              <th className="text-right font-medium pb-2 px-2 whitespace-nowrap">Entradas</th>
              <th className="text-right font-medium pb-2 px-2 whitespace-nowrap">Salidas</th>
              <th className="text-right font-medium pb-2 pl-2 whitespace-nowrap">Neto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item) => (
              <tr key={item.month}>
                <td className="py-2.5 pr-3 text-muted-foreground capitalize whitespace-nowrap">
                  {formatReportMonth(item.month)}
                </td>
                <td className="py-2.5 px-2 text-right font-medium text-green-600 tabular-nums whitespace-nowrap">
                  {formatAmount(item.inflow)}
                </td>
                <td className="py-2.5 px-2 text-right font-medium text-red-600 tabular-nums whitespace-nowrap">
                  {formatAmount(item.outflow)}
                </td>
                <td
                  className={cn(
                    'py-2.5 pl-2 text-right font-semibold tabular-nums whitespace-nowrap',
                    item.net >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {formatAmount(item.net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
