import { describe, expect, it } from 'vitest'

import {
  buildEffectiveComponentLines,
  validateAndBuildMovementPayload,
} from '../movement-form-submit'
import { newComponentLine } from '../movement-form.types'

describe('movement-form-submit', () => {
  const baseAccounts = [{ id: 'acc-1', type: 'bank' as const }]

  it('arma líneas efectivas en modo cuenta única', () => {
    const lines = buildEffectiveComponentLines({
      type: 'income',
      showPaymentSplit: false,
      componentLines: [newComponentLine()],
      accountId: 'acc-1',
      amount: '1000',
      accounts: baseAccounts,
    })
    expect(lines).toHaveLength(1)
    expect(lines[0]?.accountId).toBe('acc-1')
  })

  it('valida cobro con contacto y sin categoría', () => {
    const result = validateAndBuildMovementPayload({
      type: 'income',
      operationKind: 'collection',
      movementScope: 'project',
      date: '2026-05-19',
      amount: '500',
      currency: 'ARS',
      description: '',
      method: 'cash',
      accountId: 'acc-1',
      categoryId: '',
      contactId: 'contact-1',
      sourceAccountId: '',
      destinationAccountId: '',
      adjustmentReason: '',
      fundOwner: 'company',
      projectId: '',
      showPaymentSplit: false,
      componentLines: [newComponentLine()],
      effectiveComponentLines: buildEffectiveComponentLines({
        type: 'income',
        showPaymentSplit: false,
        componentLines: [newComponentLine()],
        accountId: 'acc-1',
        amount: '500',
        accounts: baseAccounts,
      }),
      accounts: baseAccounts,
      categories: [],
      contacts: [{ id: 'contact-1', name: 'Cliente Demo' }],
      cashDateContext: null,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.operationKind).toBe('collection')
      expect(result.data.contactId).toBe('contact-1')
      expect(result.data.categoryId).toBeUndefined()
    }
  })
})
