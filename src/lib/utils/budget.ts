export type BudgetEvaluation = {
  requiresBudgetApproval: boolean
  overBudgetBy: number
  outOfTerm: boolean
}

export function evaluateBudgetStatus(params: {
  budgetAmount: number
  spentAmount: number
  newExpenseAmount: number
  endDate: string | null
  movementDate: Date
}): BudgetEvaluation {
  const { budgetAmount, spentAmount, newExpenseAmount, endDate, movementDate } = params
  const projected = spentAmount + newExpenseAmount
  const overBudgetBy = Math.max(0, projected - Math.max(0, budgetAmount))
  const outOfTerm = !!endDate && movementDate > new Date(`${endDate}T23:59:59`)
  return {
    requiresBudgetApproval: overBudgetBy > 0 || outOfTerm,
    overBudgetBy,
    outOfTerm,
  }
}
