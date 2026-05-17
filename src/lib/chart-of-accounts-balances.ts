import type { ChartAccountRow } from '@/lib/actions/chart-of-accounts'

export type ChartAccountWithBalance = ChartAccountRow & {
  balance: number
}

/** Suma saldos de hojas imputables bajo un nodo (incluye todo el subárbol). */
export function rollupChartBalances(
  rows: ChartAccountWithBalance[]
): Map<string, number> {
  const byParent = new Map<string | null, ChartAccountWithBalance[]>()
  const direct = new Map<string, number>()

  for (const row of rows) {
    direct.set(row.id, row.balance)
    const list = byParent.get(row.parentId) ?? []
    list.push(row)
    byParent.set(row.parentId, list)
  }

  const memo = new Map<string, number>()

  function subtreeSum(id: string): number {
    const cached = memo.get(id)
    if (cached !== undefined) return cached

    const children = byParent.get(id) ?? []
    let total = 0
    for (const child of children) {
      if (child.isPostable) {
        total += direct.get(child.id) ?? 0
      } else {
        total += subtreeSum(child.id)
      }
    }
    memo.set(id, total)
    return total
  }

  const rolled = new Map<string, number>()
  for (const row of rows) {
    rolled.set(row.id, row.isPostable ? (direct.get(row.id) ?? 0) : subtreeSum(row.id))
  }
  return rolled
}

export function formatChartBalance(amount: number, currency: string): string {
  try {
    const locale =
      currency === 'ARS' ? 'es-AR' :
      currency === 'COP' ? 'es-CO' :
      currency === 'EUR' ? 'es-ES' :
      'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'COP' ? 0 : 2,
      maximumFractionDigits: currency === 'COP' ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}
