import { describe, expect, it } from 'vitest'

import { rollupChartBalances, type ChartAccountWithBalance } from '@/lib/chart-of-accounts-balances'

const rows: ChartAccountWithBalance[] = [
  {
    id: 'root',
    parentId: null,
    code: '1',
    name: 'Activo',
    accountType: 'asset',
    isPostable: false,
    sortOrder: 1,
    balance: 0,
  },
  {
    id: 'leaf',
    parentId: 'root',
    code: '1.1',
    name: 'Caja',
    accountType: 'asset',
    isPostable: true,
    sortOrder: 2,
    balance: 100,
  },
]

describe('rollupChartBalances', () => {
  it('sums postable children into group nodes', () => {
    const rolled = rollupChartBalances(rows)
    expect(rolled.get('leaf')).toBe(100)
    expect(rolled.get('root')).toBe(100)
  })
})
