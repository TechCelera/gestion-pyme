/** Canonical tenant roles (code). Product labels: Administrador / Colaborador. */
export const USER_ROLES = {
  ADMIN: 'admin',
  COLLABORATOR: 'collaborator',
} as const

export type CanonicalUserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

const ADMIN_SLUGS = new Set([
  USER_ROLES.ADMIN,
  'superadmin',
  'admin_finanzas',
])

const COLLABORATOR_SLUGS = new Set([USER_ROLES.COLLABORATOR, 'vendedor', 'responsable'])

export function normalizeRole(role: string | null | undefined): CanonicalUserRole | null {
  if (!role) return null
  const slug = role.trim().toLowerCase()
  if (ADMIN_SLUGS.has(slug)) return USER_ROLES.ADMIN
  if (COLLABORATOR_SLUGS.has(slug)) return USER_ROLES.COLLABORATOR
  return null
}

export function getUserRoleLabel(role: string | null | undefined): string {
  const canonical = normalizeRole(role)
  if (canonical === USER_ROLES.ADMIN) return 'Administrador'
  if (canonical === USER_ROLES.COLLABORATOR) return 'Colaborador'
  return role?.trim() || 'Usuario'
}

export function isAdminRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === USER_ROLES.ADMIN
}

/** @deprecated Use isAdminRole */
export function isFinanceApproverRole(role: string | null | undefined): boolean {
  return isAdminRole(role)
}
