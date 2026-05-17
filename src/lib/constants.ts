export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  /** Listado de movimientos; ruta canónica (véase DECISIONES §5) */
  MOVEMENTS: '/operaciones',
  REPORTS: '/reportes',
  CATEGORIES: '/categorias',
  SETTINGS: '/configuracion',
} as const

export const USER_ROLE_LABELS: Record<string, string> = {
  superadmin: 'Superadministrador',
  admin_finanzas: 'Administrador de finanzas',
  responsable: 'Responsable',
  vendedor: 'Vendedor',
}

export const MOVEMENT_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const

export const MOVEMENT_METHODS = {
  CASH: 'cash',
  TRANSFER: 'transfer',
  CARD: 'card',
  DIGITAL: 'digital',
  OTHER: 'other',
} as const

export const MOVEMENT_METHODS_LABELS: Record<string, string> = {
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

export function isFinanceApproverRole(role: string | null | undefined): boolean {
  return role === USER_ROLES.SUPERADMIN || role === USER_ROLES.ADMIN_FINANZAS
}

/** Tipos de categoría en BD — mismo criterio que movimientos income/expense */
export const CATEGORY_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const

export type CategoryType = (typeof CATEGORY_TYPES)[keyof typeof CATEGORY_TYPES]

export const CATEGORY_TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: CATEGORY_TYPES.INCOME, label: 'Ingreso' },
  { value: CATEGORY_TYPES.EXPENSE, label: 'Gasto' },
]

export function isCategoryIncomeType(type: string): boolean {
  return type === CATEGORY_TYPES.INCOME
}

export function isCategoryExpenseType(type: string): boolean {
  return type === CATEGORY_TYPES.EXPENSE
}

export function getCategoryTypeLabel(type: string): string {
  return isCategoryIncomeType(type) ? 'Ingreso' : 'Gasto'
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  bank: 'Bancaria',
  other: 'Otra',
}

export const PERIOD_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
} as const

export const MAX_USERS_PER_COMPANY = 4
