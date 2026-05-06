import { describe, it, expect } from 'vitest'
import {
  createOperationSchema,
  updateOperationSchema,
  operationFiltersSchema,
  updateOperationStatusSchema,
  OperationTypeEnum,
  OperationStatusEnum,
} from '../operation'

describe('Validaciones de operación', () => {
  describe('createOperationSchema', () => {
    const validIncome = {
      type: 'income',
      date: new Date(),
      amount: 100,
      description: 'Venta de producto',
      accountId: '550e8400-e29b-41d4-a716-446655440000',
      categoryId: '550e8400-e29b-41d4-a716-446655440001',
    }

    it('should validate a valid income transaction', () => {
      const result = createOperationSchema.safeParse(validIncome)
      expect(result.success).toBe(true)
    })

    it('should require accountId for income', () => {
      const invalid = { ...validIncome, accountId: undefined }
      const result = createOperationSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should require categoryId for income', () => {
      const invalid = { ...validIncome, categoryId: undefined }
      const result = createOperationSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should require positive amount', () => {
      const invalid = { ...validIncome, amount: -100 }
      const result = createOperationSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should require description with at least 3 characters', () => {
      const invalid = { ...validIncome, description: 'AB' }
      const result = createOperationSchema.safeParse(invalid)
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
      const result = createOperationSchema.safeParse(validTransfer)
      expect(result.success).toBe(true)
    })

    it('should require sourceAccountId for transfer', () => {
      const invalid = { ...validTransfer, sourceAccountId: undefined }
      const result = createOperationSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should require destinationAccountId for transfer', () => {
      const invalid = { ...validTransfer, destinationAccountId: undefined }
      const result = createOperationSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject same source and destination accounts', () => {
      const invalid = {
        ...validTransfer,
        sourceAccountId: '550e8400-e29b-41d4-a716-446655440000',
        destinationAccountId: '550e8400-e29b-41d4-a716-446655440000',
      }
      const result = createOperationSchema.safeParse(invalid)
      expect(result.success).toBe(false)
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
      const result = createOperationSchema.safeParse(validAdjustment)
      expect(result.success).toBe(true)
    })

    it('should require adjustmentReason for adjustment', () => {
      const invalid = { ...validAdjustment, adjustmentReason: undefined }
      const result = createOperationSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('updateOperationSchema', () => {
    it('should allow partial updates', () => {
      const update = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 200,
      }
      const result = updateOperationSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should require id for update', () => {
      const update = { amount: 200 }
      const result = updateOperationSchema.safeParse(update)
      expect(result.success).toBe(false)
    })
  })

  describe('operationFiltersSchema', () => {
    it('should validate empty filters', () => {
      const result = operationFiltersSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate filters with status', () => {
      const filters = {
        status: ['draft', 'pending'],
        page: 1,
        pageSize: 50,
      }
      const result = operationFiltersSchema.safeParse(filters)
      expect(result.success).toBe(true)
    })

    it('should use default pagination values', () => {
      const result = operationFiltersSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(50)
    })
  })

  describe('updateOperationStatusSchema', () => {
    it('should validate status update', () => {
      const update = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'approved',
      }
      const result = updateOperationStatusSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should allow optional reason', () => {
      const update = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'rejected',
        reason: 'Datos incorrectos',
      }
      const result = updateOperationStatusSchema.safeParse(update)
      expect(result.success).toBe(true)
    })
  })
})
