import { describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'

import { MovementFriendlyPaymentBreakdown } from '../movement-friendly-payment-breakdown'
import type { Account } from '@/lib/actions/accounts'

const accounts: Account[] = [
  { id: 'acc-bank', name: 'Banco', type: 'bank', currency: 'ARS', balance: 0 },
]

describe('MovementFriendlyPaymentBreakdown', () => {
  it('aplica monto vía evento E2E en la primera fila', () => {
    const onComponentLinesChange = vi.fn()
    const initial = [
      {
        localId: 'line-1',
        componentType: 'operative_bank' as const,
        accountId: 'acc-bank',
        contactId: '',
        amount: '',
      },
    ]

    render(
      <MovementFriendlyPaymentBreakdown
        movementType="income"
        operationKind="collection"
        componentLines={initial}
        onComponentLinesChange={onComponentLinesChange}
        accounts={accounts}
        filteredContacts={[]}
        currency="ARS"
      />
    )

    act(() => {
      window.dispatchEvent(
        new CustomEvent('gestion-pyme:e2e-set-guided-payment-amount', {
          detail: { rowIndex: 0, canonical: '2500.00' },
        })
      )
    })

    expect(onComponentLinesChange).toHaveBeenCalled()
    const updater = onComponentLinesChange.mock.calls.at(-1)?.[0] as (
      prev: typeof initial
    ) => typeof initial
    const next = updater(initial)
    expect(next[0]?.amount).toBe('2500.00')
  })
})
