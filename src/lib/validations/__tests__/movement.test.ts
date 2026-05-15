import { describe, it, expect } from 'vitest'
import {
  createMovementSchema,
  updateMovementSchema,
  movementFiltersSchema,
  updateMovementStatusSchema,
  DEFAULT_TRANSFER_DESCRIPTION,
} from '../movement'

describe('operation validation', () => {
  describe('createMovementSchema', () => {
    const validIncome = {
      type: 'income',
      date: new Date(),
      amount: 100,
      description: 'Venta de producto',
      accountId: '550e8400-e29b-41d4-a716-446655440000',
      categoryId: '550e8400-e29b-41d4-a716-446655440001',
      movementComponents: [
        {
          componentType: 'operative_cash',
          accountId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 100,
        },
      ],
    }

    it('should validate a valid income transaction', () => {
      const result = createMovementSchema.safeParse(validIncome)
      expect(result.success).toBe(true)
    })

    it('should require accountId for income', () => {
      const invalid = { ...validIncome, accountId: undefined }
      const result = createMovementSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should require categoryId for income', () => {
      const invalid = { ...validIncome, categoryId: undefined }
      const result = createMovementSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should require positive amount', () => {
      const invalid = { ...validIncome, amount: -100 }
      const result = createMovementSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should require description with at least 3 characters', () => {
      const invalid = { ...validIncome, description: 'AB' }
      const result = createMovementSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should require operation components for income/expense', () => {
      const invalid = { ...validIncome, movementComponents: undefined }
      const result = createMovementSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('transfer transactions', () => {
    const validTransfer = {
      type: 'transfer',
      date: new Date(),
      amount: 500,
      description: 'Transferencia entre cuentas',
      sourceAccountId: '550e8400-e29b-41d4-a716-446655440000',
      destinationAccountId: '550e8400-e29b-41d4-a716-446655440001',
    }

    it('should validate a valid transfer', () => {
      const result = createMovementSchema.safeParse(validTransfer)
      expect(result.success).toBe(true)
    })

    it('should require sourceAccountId for transfer', () => {
      const invalid = { ...validTransfer, sourceAccountId: undefined }
      const result = createMovementSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should require destinationAccountId for transfer', () => {
      const invalid = { ...validTransfer, destinationAccountId: undefined }
      const result = createMovementSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject same source and destination accounts', () => {
      const invalid = {
        ...validTransfer,
        sourceAccountId: '550e8400-e29b-41d4-a716-446655440000',
        destinationAccountId: '550e8400-e29b-41d4-a716-446655440000',
      }
      const result = createMovementSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should default short or empty description on transfer', () => {
      const sparse = { ...validTransfer, description: '' }
      const r1 = createMovementSchema.safeParse(sparse)
      expect(r1.success).toBe(true)
      if (r1.success) {
        expect(r1.data.description).toBe(DEFAULT_TRANSFER_DESCRIPTION)
      }
      const r2 = createMovementSchema.safeParse({ ...validTransfer, description: 'AB' })
      expect(r2.success).toBe(true)
      if (r2.success) {
        expect(r2.data.description).toBe(DEFAULT_TRANSFER_DESCRIPTION)
      }
    })
  })

  describe('adjustment transactions', () => {
    const validAdjustment = {
      type: 'adjustment',
      date: new Date(),
      amount: 50,
      description: 'Ajuste de conciliación',
      accountId: '550e8400-e29b-41d4-a716-446655440000',
      adjustmentReason: 'reconciliation',
    }

    it('should validate a valid adjustment', () => {
      const result = createMovementSchema.safeParse(validAdjustment)
      expect(result.success).toBe(true)
    })

    it('should require adjustmentReason for adjustment', () => {
      const invalid = { ...validAdjustment, adjustmentReason: undefined }
      const result = createMovementSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('updateMovementSchema', () => {
    it('should allow partial updates', () => {
      const update = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 200,
      }
      const result = updateMovementSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should require id for update', () => {
      const update = { amount: 200 }
      const result = updateMovementSchema.safeParse(update)
      expect(result.success).toBe(false)
    })
  })

  describe('movementFiltersSchema', () => {
    it('should validate empty filters', () => {
      const result = movementFiltersSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate filters with status', () => {
      const filters = {
        status: ['draft', 'pending'],
        page: 1,
        pageSize: 50,
      }
      const result = movementFiltersSchema.safeParse(filters)
      expect(result.success).toBe(true)
    })

    it('should use default pagination values', () => {
      const result = movementFiltersSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(50)
    })
  })

  describe('updateMovementStatusSchema', () => {
    it('should validate status update', () => {
      const update = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'approved',
      }
      const result = updateMovementStatusSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should allow optional reason', () => {
      const update = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'rejected',
        reason: 'Datos incorrectos',
      }
      const result = updateMovementStatusSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should require reason for rejected', () => {
      const update = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'rejected' as const,
      }
      const result = updateMovementStatusSchema.safeParse(update)
      expect(result.success).toBe(false)
    })

    it('should require reason for cancelled', () => {
      const update = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'cancelled' as const,
      }
      const result = updateMovementStatusSchema.safeParse(update)
      expect(result.success).toBe(false)
    })

    it('should accept cancelled with reason', () => {
      const update = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'cancelled' as const,
        reason: ' Error de carga ',
      }
      const result = updateMovementStatusSchema.safeParse(update)
      expect(result.success).toBe(true)
    })
  })
})
