import { describe, expect, it } from 'vitest'
import { hasCashFlowTrendData, hasNonZeroAmounts } from '@/lib/charts/has-chart-data'

describe('hasNonZeroAmounts', () => {
  it('returns false when all values are zero', () => {
    expect(hasNonZeroAmounts([0, 0, 0])).toBe(false)
  })

  it('returns true when at least one value is non-zero', () => {
    expect(hasNonZeroAmounts([0, 1500, 0])).toBe(true)
  })
})

describe('hasCashFlowTrendData', () => {
  it('returns false for empty trend', () => {
    expect(hasCashFlowTrendData([])).toBe(false)
  })

  it('returns false when all months are zero', () => {
    expect(
      hasCashFlowTrendData([
        { inflow: 0, outflow: 0 },
        { inflow: 0, outflow: 0 },
      ])
    ).toBe(false)
  })

  it('returns true when any month has movement', () => {
    expect(hasCashFlowTrendData([{ inflow: 0, outflow: 500 }])).toBe(true)
  })
})
