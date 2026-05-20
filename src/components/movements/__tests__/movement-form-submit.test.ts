import { describe, expect, it } from 'vitest'

import { CASH_DATE_GENERAL_ERROR_MESSAGE } from '@/lib/movements/cash-date-policy'

import {
  buildEffectiveComponentLines,
  buildMovementComponentsFromDrafts,
  resolvePrimaryAccountId,
  validateAndBuildMovementPayload,
} from '../movement-form-submit'
import { newComponentLine } from '../movement-form.types'
import { buildSubmitInput, submitFixtureAccounts } from './movement-form-submit.fixture'

describe('movement-form-submit', () => {
  describe('buildEffectiveComponentLines', () => {
    it('arma líneas efectivas en modo cuenta única', () => {
      const lines = buildEffectiveComponentLines({
        type: 'income',
        showPaymentSplit: false,
        componentLines: [newComponentLine()],
        accountId: 'acc-bank',
        amount: '1000',
        accounts: submitFixtureAccounts,
      })
      expect(lines).toHaveLength(1)
      expect(lines[0]?.accountId).toBe('acc-bank')
    })

    it('conserva líneas en modo desglose', () => {
      const draft = [newComponentLine(), newComponentLine()]
      const lines = buildEffectiveComponentLines({
        type: 'income',
        showPaymentSplit: true,
        componentLines: draft,
        accountId: 'acc-bank',
        amount: '1000',
        accounts: submitFixtureAccounts,
      })
      expect(lines).toBe(draft)
    })
  })

  describe('buildMovementComponentsFromDrafts', () => {
    it('rechaza suma distinta al monto total', () => {
      const lines = buildMovementComponentsFromDrafts({
        effectiveComponentLines: [
          {
            ...newComponentLine(),
            accountId: 'acc-bank',
            amount: '500',
            componentType: 'operative_bank',
          },
        ],
        amount: '1000',
        currency: 'ARS',
      })
      expect(lines).toEqual([])
    })

    it('acepta línea única que cuadra con el total', () => {
      const lines = buildMovementComponentsFromDrafts({
        effectiveComponentLines: [
          {
            ...newComponentLine(),
            accountId: 'acc-bank',
            amount: '1000',
            componentType: 'operative_bank',
          },
        ],
        amount: '1000',
        currency: 'ARS',
      })
      expect(lines).toHaveLength(1)
      expect(lines[0]?.amount).toBe(1000)
    })
  })

  describe('resolvePrimaryAccountId', () => {
    it('prioriza cuenta operativa del desglose', () => {
      const id = resolvePrimaryAccountId(
        [
          {
            componentType: 'operative_bank',
            accountId: 'acc-bank',
            amount: 100,
            currency: 'ARS',
          },
        ],
        'fallback'
      )
      expect(id).toBe('acc-bank')
    })
  })

  describe('validateAndBuildMovementPayload', () => {
    it('valida cobro con contacto, sin categoría y descripción autogenerada', () => {
      const input = buildSubmitInput({
        operationKind: 'collection',
        categoryId: '',
        description: '',
      })

      const result = validateAndBuildMovementPayload(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.operationKind).toBe('collection')
        expect(result.data.contactId).toBe('contact-1')
        expect(result.data.contactType).toBe('cliente')
        expect(result.data.categoryId).toBeUndefined()
        expect(result.data.description).toBe('Cobro: Cliente Demo')
      }
    })

    it('valida pago con proveedor y contactType', () => {
      const input = buildSubmitInput({
        type: 'expense',
        operationKind: 'payment',
        contactId: 'prov-1',
        contacts: [{ id: 'prov-1', name: 'Proveedor SA' }],
      })

      const result = validateAndBuildMovementPayload(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.operationKind).toBe('payment')
        expect(result.data.contactType).toBe('proveedor')
        expect(result.data.description).toBe('Pago: Proveedor SA')
      }
    })

    it('valida venta con categoría obligatoria', () => {
      const input = buildSubmitInput({
        operationKind: 'sale',
        categoryId: 'cat-1',
        contactId: '',
      })

      const result = validateAndBuildMovementPayload(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.categoryId).toBe('cat-1')
        expect(result.data.description).toBe('Venta: Ventas')
      }
    })

    it('rechaza venta sin categoría', () => {
      const result = validateAndBuildMovementPayload(
        buildSubmitInput({ operationKind: 'sale', categoryId: '' })
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toMatch(/categoría/i)
      }
    })

    it('rechaza cobro sin contacto', () => {
      const result = validateAndBuildMovementPayload(
        buildSubmitInput({ operationKind: 'collection', contactId: '' })
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toMatch(/contacto/i)
      }
    })

    it('rechaza monto cero o inválido', () => {
      const result = validateAndBuildMovementPayload(buildSubmitInput({ amount: '0' }))
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toMatch(/monto/i)
      }
    })

    it('rechaza cobro sin cuenta en modo único', () => {
      const input = buildSubmitInput({
        operationKind: 'collection',
        accountId: '',
        effectiveComponentLines: [],
      })
      const result = validateAndBuildMovementPayload(input)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toMatch(/cuenta/i)
      }
    })

    it('rechaza fecha de efectivo fuera de ventana en general empresa', () => {
      const result = validateAndBuildMovementPayload(
        buildSubmitInput({
          cashDateContext: {
            hasCash: true,
            bounds: { min: '2026-05-19', max: '2026-05-20' },
            isAllowed: false,
          },
        })
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toBe(CASH_DATE_GENERAL_ERROR_MESSAGE)
      }
    })

    it('rechaza desglose cuya suma no cuadra con el total', () => {
      const line = {
        ...newComponentLine(),
        accountId: 'acc-bank',
        amount: '500',
        componentType: 'operative_bank' as const,
      }
      const result = validateAndBuildMovementPayload(
        buildSubmitInput({
          operationKind: 'sale',
          categoryId: 'cat-1',
          amount: '1000',
          showPaymentSplit: true,
          componentLines: [line],
          effectiveComponentLines: [line],
        })
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toMatch(/suma|coincidir/i)
      }
    })
  })
})
