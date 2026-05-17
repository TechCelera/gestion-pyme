import { describe, expect, it } from 'vitest'
import { createCategorySchema, normalizeCategoryType } from '../category'

describe('category validation', () => {
  it('accepts income and expense', () => {
    expect(createCategorySchema.safeParse({ name: 'Ventas', type: 'income' }).success).toBe(true)
    expect(createCategorySchema.safeParse({ name: 'Sueldos', type: 'expense' }).success).toBe(true)
  })

  it('rejects legacy expense subtypes', () => {
    expect(createCategorySchema.safeParse({ name: 'X', type: 'cost' }).success).toBe(false)
    expect(createCategorySchema.safeParse({ name: 'X', type: 'admin_expense' }).success).toBe(false)
  })

  it('normalizes legacy types to expense', () => {
    expect(normalizeCategoryType('cost')).toBe('expense')
    expect(normalizeCategoryType('admin_expense')).toBe('expense')
    expect(normalizeCategoryType('income')).toBe('income')
    expect(normalizeCategoryType('expense')).toBe('expense')
  })
})
