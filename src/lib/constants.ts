export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const

export const TRANSACTION_METHODS = {
  CASH: 'cash',
  TRANSFER: 'transfer',
  CARD: 'card',
  NEQUI: 'nequi',
  OTHER: 'other',
} as const

export const TRANSACTION_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  nequi: 'Nequi',
  other: 'Otro',
}

export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN_FINANZAS: 'admin_finanzas',
  RESPONSABLE: 'responsable',
  VENDEDOR: 'vendedor',
} as const

export const CATEGORY_TYPES = {
  INCOME: 'income',
  COST: 'cost',
  ADMIN_EXPENSE: 'admin_expense',
  COMMERCIAL_EXPENSE: 'commercial_expense',
  FINANCIAL_EXPENSE: 'financial_expense',
} as const

export const PERIOD_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
} as const

export const MAX_USERS_PER_COMPANY = 4