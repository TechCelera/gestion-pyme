import { describe, it, expect } from 'vitest'
import {
  createMovementSchema,
  movementComponentSchema,
  mapMovementComponentsToRpcJson,
  updateMovementSchema,
} from '../movement'

describe('movementComponentSchema', () => {
  it('exige cuenta para medios operativos', () => {
    const r = movementComponentSchema.safeParse({
      componentType: 'operative_cash',
      amount: 100,
    })
    expect(r.success).toBe(false)
  })

  it('acepta efectivo con cuenta', () => {
    const r = movementComponentSchema.safeParse({
      componentType: 'operative_bank',
      accountId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 50,
    })
    expect(r.success).toBe(true)
  })

  it('exige contacto para cuenta corriente cliente', () => {
    const r = movementComponentSchema.safeParse({
      componentType: 'client_receivable',
      amount: 10,
    })
    expect(r.success).toBe(false)
  })
})

describe('createMovementSchema + movementComponents', () => {
  const base = {
    type: 'income' as const,
    date: new Date('2026-05-01'),
    amount: 150,
    currency: 'ARS',
    description: 'Venta mixta de prueba',
    accountId: '550e8400-e29b-41d4-a716-446655440001',
    categoryId: '550e8400-e29b-41d4-a716-446655440002',
  }

  it('rechaza suma distinta al total', () => {
    const r = createMovementSchema.safeParse({
      ...base,
      movementComponents: [
        {
          componentType: 'operative_cash',
          accountId: '550e8400-e29b-41d4-a716-446655440001',
          amount: 100,
        },
        {
          componentType: 'client_receivable',
          contactId: '550e8400-e29b-41d4-a716-446655440003',
          amount: 30,
        },
      ],
    })
    expect(r.success).toBe(false)
  })

  it('acepta desglose que suma al total en ingreso', () => {
    const r = createMovementSchema.safeParse({
      ...base,
      movementComponents: [
        {
          componentType: 'operative_cash',
          accountId: '550e8400-e29b-41d4-a716-446655440001',
          amount: 100,
        },
        {
          componentType: 'client_receivable',
          contactId: '550e8400-e29b-41d4-a716-446655440003',
          amount: 50,
        },
      ],
    })
    expect(r.success).toBe(true)
  })

  it('rechaza proveedor en ingreso', () => {
    const r = createMovementSchema.safeParse({
      ...base,
      movementComponents: [
        {
          componentType: 'supplier_payable',
          contactId: '550e8400-e29b-41d4-a716-446655440003',
          amount: 150,
        },
      ],
    })
    expect(r.success).toBe(false)
  })
})

describe('updateMovementSchema + movementComponents', () => {
  const id = '550e8400-e29b-41d4-a716-446655440099'

  it('rechaza suma distinta al monto cuando ambos vienen', () => {
    const r = updateMovementSchema.safeParse({
      id,
      amount: 100,
      movementComponents: [
        {
          componentType: 'operative_cash',
          accountId: '550e8400-e29b-41d4-a716-446655440001',
          amount: 40,
        },
      ],
    })
    expect(r.success).toBe(false)
  })
})

describe('mapMovementComponentsToRpcJson', () => {
  it('emite claves snake_case para Supabase', () => {
    const j = mapMovementComponentsToRpcJson(
      [
        {
          componentType: 'operative_cash',
          accountId: '550e8400-e29b-41d4-a716-446655440001',
          amount: 10,
        },
      ],
      'ARS'
    )
    expect(j[0]).toEqual({
      component_type: 'operative_cash',
      account_id: '550e8400-e29b-41d4-a716-446655440001',
      contact_id: null,
      amount: 10,
      currency: 'ARS',
    })
  })
})
