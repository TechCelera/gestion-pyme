/** CMV = costo mercadería vendida (nombres seed AR/CO + distribuidora). */
const CMV_NAMES = new Set([
  'compra mercadería',
  'costo de mercadería',
  'costo de mercancía',
])

export function isDistribuidoraCmvCategory(categoryName: string): boolean {
  return CMV_NAMES.has(categoryName.trim().toLowerCase())
}

export interface DistribuidoraResults {
  sales: number
  cmv: number
  grossResult: number
  operatingExpenses: number
  netResult: number
}

export function computeDistribuidoraResults(
  totalIncome: number,
  expenseBreakdown: ReadonlyArray<{ category: string; amount: number }>
): DistribuidoraResults {
  let cmv = 0
  let operatingExpenses = 0
  for (const row of expenseBreakdown) {
    if (isDistribuidoraCmvCategory(row.category)) {
      cmv += row.amount
    } else {
      operatingExpenses += row.amount
    }
  }
  const grossResult = totalIncome - cmv
  return {
    sales: totalIncome,
    cmv,
    grossResult,
    operatingExpenses,
    netResult: grossResult - operatingExpenses,
  }
}
