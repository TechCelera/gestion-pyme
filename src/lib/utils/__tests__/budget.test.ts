import { describe, it, expect } from 'vitest'
import { evaluateBudgetStatus } from '../budget'

describe('evaluateBudgetStatus', () => {
  it('no requiere aprobación si el gasto cabe en presupuesto y plazo', () => {
    const result = evaluateBudgetStatus({
      budgetAmount: 10_000,
      spentAmount: 3_000,
      newExpenseAmount: 2_000,
      endDate: '2026-12-31',
      movementDate: new Date('2026-06-15'),
    })
    expect(result).toEqual({
      requiresBudgetApproval: false,
      overBudgetBy: 0,
      outOfTerm: false,
    })
  })

  it('requiere aprobación si supera presupuesto', () => {
    const result = evaluateBudgetStatus({
      budgetAmount: 5_000,
      spentAmount: 4_500,
      newExpenseAmount: 1_000,
      endDate: null,
      movementDate: new Date('2026-06-01'),
    })
    expect(result.requiresBudgetApproval).toBe(true)
    expect(result.overBudgetBy).toBe(500)
    expect(result.outOfTerm).toBe(false)
  })

  it('requiere aprobación si la fecha del movimiento es posterior al fin del proyecto', () => {
    const result = evaluateBudgetStatus({
      budgetAmount: 20_000,
      spentAmount: 0,
      newExpenseAmount: 100,
      endDate: '2026-04-30',
      movementDate: new Date('2026-05-02'),
    })
    expect(result.requiresBudgetApproval).toBe(true)
    expect(result.outOfTerm).toBe(true)
    expect(result.overBudgetBy).toBe(0)
  })

  it('trata presupuesto cero como sin margen', () => {
    const result = evaluateBudgetStatus({
      budgetAmount: 0,
      spentAmount: 0,
      newExpenseAmount: 1,
      endDate: null,
      movementDate: new Date('2026-01-01'),
    })
    expect(result.requiresBudgetApproval).toBe(true)
    expect(result.overBudgetBy).toBe(1)
  })
})
