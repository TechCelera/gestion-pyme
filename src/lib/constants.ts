export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  /** Listado de movimientos; ruta canónica (véase DECISIONES §5) */
  MOVEMENTS: '/operaciones',
  REPORTS: '/reportes',
  CATEGORIES: '/categorias',
  TEAM: '/equipo',
  SETTINGS: '/configuracion',
  FORGOT_PASSWORD: '/recuperar-contrasena',
  RESET_PASSWORD: '/nueva-contrasena',
} as const

export {
  getUserRoleLabel,
  isAdminRole,
  isFinanceApproverRole,
  normalizeRole,
  USER_ROLES,
} from '@/lib/auth/roles'

/** Product labels for role slugs (canonical + legacy DB values). */
export const USER_ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  collaborator: 'Colaborador',
  superadmin: 'Administrador',
  admin_finanzas: 'Administrador',
  responsable: 'Colaborador',
  vendedor: 'Colaborador',
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

/** Etiquetas de producto para tipo de movimiento (código: income | expense | …). */
export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Egreso',
  transfer: 'Transferencia',
  adjustment: 'Ajuste',
}

export function getMovementTypeLabel(type: string): string {
  return MOVEMENT_TYPE_LABELS[type] ?? type
}

/** Tipos de categoría en BD — mismo criterio que movimientos income/expense */
export const CATEGORY_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const

export type CategoryType = (typeof CATEGORY_TYPES)[keyof typeof CATEGORY_TYPES]

export const CATEGORY_TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: CATEGORY_TYPES.INCOME, label: 'Ingreso' },
  { value: CATEGORY_TYPES.EXPENSE, label: 'Egreso' },
]

export function isCategoryIncomeType(type: string): boolean {
  return type === CATEGORY_TYPES.INCOME
}

export function isCategoryExpenseType(type: string): boolean {
  return type === CATEGORY_TYPES.EXPENSE
}

export function getCategoryTypeLabel(type: string): string {
  return isCategoryIncomeType(type) ? 'Ingreso' : 'Egreso'
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
