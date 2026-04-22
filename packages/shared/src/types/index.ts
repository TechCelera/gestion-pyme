export type UserRole = 'superadmin' | 'admin_finanzas' | 'responsable' | 'vendedor'
export type TransactionType = 'income' | 'expense'
export type TransactionMethod = 'accrual' | 'cash'
export type PeriodStatus = 'open' | 'closed'
export type CategoryType = 'income' | 'cost' | 'admin_expense' | 'commercial_expense' | 'financial_expense'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  companyId: string
}

export interface DashboardMetrics {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  cashFlowBalance: number
}