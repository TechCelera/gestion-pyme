import { describe, it, expect } from 'vitest'
import {
  createOperationSchema,
  operationComponentSchema,
  mapOperationComponentsToRpcJson,
  updateOperationSchema,
} from '../operation'

describe('operationComponentSchema', () => {
  it('exige cuenta para medios operativos', () => {
    const r = operationComponentSchema.safeParse({
      componentType: 'operative_cash',
      amount: 100,
    })
    expect(r.success).toBe(false)
  })

  it('acepta efectivo con cuenta', () => {
    const r = operationComponentSchema.safeParse({
      componentType: 'operative_bank',
      accountId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 50,
    })
    expect(r.success).toBe(true)
  })

  it('exige contacto para cuenta corriente cliente', () => {
    const r = operationComponentSchema.safeParse({
      componentType: 'client_receivable',
      amount: 10,
    })
    expect(r.success).toBe(false)
  })
})

describe('createOperationSchema + operationComponents', () => {
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
    const r = createOperationSchema.safeParse({
      ...base,
      operationComponents: [
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
    const r = createOperationSchema.safeParse({
      ...base,
      operationComponents: [
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
    const r = createOperationSchema.safeParse({
      ...base,
      operationComponents: [
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

describe('updateOperationSchema + operationComponents', () => {
  const id = '550e8400-e29b-41d4-a716-446655440099'

  it('rechaza suma distinta al monto cuando ambos vienen', () => {
    const r = updateOperationSchema.safeParse({
      id,
      amount: 100,
      operationComponents: [
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

describe('mapOperationComponentsToRpcJson', () => {
  it('emite claves snake_case para Supabase', () => {
    const j = mapOperationComponentsToRpcJson(
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
