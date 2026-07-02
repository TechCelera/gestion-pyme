'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format/currency'
import type { DistribuidoraResults } from '@/lib/distribuidora/distribuidora-results'

type DistribuidoraResultsCardProps = {
  periodLabel: string
  results: DistribuidoraResults
  currency: string
}

function ResultRow({
  label,
  value,
  currency,
  emphasis = false,
}: {
  label: string
  value: number
  currency: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className={emphasis ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
      <span
        className={
          emphasis
            ? 'text-lg font-bold tabular-nums text-foreground'
            : 'tabular-nums text-foreground'
        }
      >
        {formatCurrency(value, currency)}
      </span>
    </div>
  )
}

export function DistribuidoraResultsCard({
  periodLabel,
  results,
  currency,
}: DistribuidoraResultsCardProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Resultado distribuidora</CardTitle>
        <CardDescription>
          Bruto y neto automáticos · {periodLabel}
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/60">
        <ResultRow label="Ventas" value={results.sales} currency={currency} />
        <ResultRow label="− Costo mercadería (CMV)" value={results.cmv} currency={currency} />
        <ResultRow label="= Resultado bruto" value={results.grossResult} currency={currency} emphasis />
        <ResultRow label="− Gastos operativos" value={results.operatingExpenses} currency={currency} />
        <ResultRow label="= Resultado neto" value={results.netResult} currency={currency} emphasis />
      </CardContent>
    </Card>
  )
}
