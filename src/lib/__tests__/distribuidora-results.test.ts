import { describe, expect, it } from 'vitest'

import { computeDistribuidoraResults, isDistribuidoraCmvCategory } from '@/lib/distribuidora/distribuidora-results'

describe('distribuidora-results', () => {
  it('identifica CMV', () => {
    expect(isDistribuidoraCmvCategory('Compra mercadería')).toBe(true)
    expect(isDistribuidoraCmvCategory('Costo de Mercadería')).toBe(true)
    expect(isDistribuidoraCmvCategory('Flete')).toBe(false)
  })

  it('calcula bruto y neto', () => {
    const r = computeDistribuidoraResults(200_000, [
      { category: 'Compra mercadería', amount: 80_000 },
      { category: 'Flete', amount: 8_500 },
      { category: 'Combustible', amount: 3_200 },
    ])
    expect(r.grossResult).toBe(120_000)
    expect(r.netResult).toBe(108_300)
  })
})
