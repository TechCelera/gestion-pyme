export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  /** Listado de movimientos (producto en ES: "operaciones") */
  OPERATIONS: '/operaciones',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const

export const OPERATION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const

export const OPERATION_METHODS = {
  CASH: 'cash',
  TRANSFER: 'transfer',
  CARD: 'card',
  DIGITAL: 'digital',
  OTHER: 'other',
} as const

export const OPERATION_METHODS_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  digital: 'Billetera Digital',
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

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  bank: 'Bancaria',
  other: 'Otra',
}

export const CATEGORY_TYPE_LABELS: Record<string, string> = {
  income: 'Ingreso',
  cost: 'Costo',
  admin_expense: 'Gasto Administrativo',
  commercial_expense: 'Gasto Comercial',
  financial_expense: 'Gasto Financiero',
}

export const PERIOD_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
} as const

export const MAX_USERS_PER_COMPANY = 4
