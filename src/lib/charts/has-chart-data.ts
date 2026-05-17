export function hasNonZeroAmounts(values: number[]): boolean {
  return values.some((value) => Number.isFinite(value) && Math.abs(value) > 0)
}

export function hasCashFlowTrendData(
  items: { inflow: number; outflow: number }[]
): boolean {
  if (items.length === 0) return false
  return items.some(
    (item) =>
      (Number.isFinite(item.inflow) && Math.abs(item.inflow) > 0) ||
      (Number.isFinite(item.outflow) && Math.abs(item.outflow) > 0)
  )
}
