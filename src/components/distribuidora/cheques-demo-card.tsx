import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format/currency'

/** ponytail: datos estáticos hasta módulo cheques real. */
const DEMO_CHEQUES = [
  { cliente: 'Dietética San Martín', monto: 45_000, cobro: 'Inmediato', deposito: 'Hoy' },
  { cliente: 'Autoservicio Rivadavia', monto: 28_500, cobro: 'Diferido', deposito: '5 jul' },
]

export function ChequesDemoCard({ currency }: { currency: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Cheques a depositar</CardTitle>
        <CardDescription>Vista demo — inmediatos y diferidos</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {DEMO_CHEQUES.map((row) => (
            <li
              key={row.cliente}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{row.cliente}</p>
                <p className="text-xs text-muted-foreground">
                  {row.cobro} · depósito {row.deposito}
                </p>
              </div>
              <span className="font-semibold tabular-nums">{formatCurrency(row.monto, currency)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
