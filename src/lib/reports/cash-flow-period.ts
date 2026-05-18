export interface CashFlowTotals {
  inflow: number
  outflow: number
  net: number
}

export interface MonthlyCashFlowRow extends CashFlowTotals {
  month: string
}

function monthBounds(monthKey: string): { start: Date; end: Date } {
  const [year, month] = monthKey.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return { start, end }
}

function monthOverlapsPeriod(monthKey: string, periodStart: Date, periodEnd: Date): boolean {
  const { start, end } = monthBounds(monthKey)
  return start <= periodEnd && end >= periodStart
}

/** Suma flujo real mensual (RPC) para todos los meses que caen en el rango seleccionado. */
export function sumRealCashFlowForPeriod(
  monthlyTrend: MonthlyCashFlowRow[],
  periodStart: Date,
  periodEnd: Date
): CashFlowTotals {
  return monthlyTrend
    .filter((row) => monthOverlapsPeriod(row.month, periodStart, periodEnd))
    .reduce(
      (acc, row) => ({
        inflow: acc.inflow + row.inflow,
        outflow: acc.outflow + row.outflow,
        net: acc.net + row.net,
      }),
      { inflow: 0, outflow: 0, net: 0 }
    )
}

/** Suma movimientos pendientes (proyectado) dentro del rango de fechas del período. */
export function sumProjectedCashFlowForPeriod(
  rows: Array<{ date?: unknown; type?: unknown; status?: unknown; amount?: unknown }>,
  periodStartStr: string,
  periodEndStr: string
): CashFlowTotals {
  let inflow = 0
  let outflow = 0

  for (const row of rows) {
    const date = String(row.date ?? '')
    if (!date || date < periodStartStr || date > periodEndStr) continue
    if (row.status !== 'pending') continue

    const amount = Number(row.amount ?? 0)
    if (Number.isNaN(amount)) continue

    if (row.type === 'income') inflow += amount
    if (row.type === 'expense') outflow += amount
  }

  return { inflow, outflow, net: inflow - outflow }
}
