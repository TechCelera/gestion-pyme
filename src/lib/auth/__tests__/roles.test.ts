import { describe, expect, it } from 'vitest'
import {
  getUserRoleLabel,
  isAdminRole,
  normalizeRole,
  USER_ROLES,
} from '@/lib/auth/roles'

describe('normalizeRole', () => {
  it('maps legacy admin slugs to admin', () => {
    expect(normalizeRole('superadmin')).toBe(USER_ROLES.ADMIN)
    expect(normalizeRole('admin_finanzas')).toBe(USER_ROLES.ADMIN)
    expect(normalizeRole('admin')).toBe(USER_ROLES.ADMIN)
  })

  it('maps legacy collaborator slugs to collaborator', () => {
    expect(normalizeRole('vendedor')).toBe(USER_ROLES.COLLABORATOR)
    expect(normalizeRole('responsable')).toBe(USER_ROLES.COLLABORATOR)
    expect(normalizeRole('collaborator')).toBe(USER_ROLES.COLLABORATOR)
  })

  it('returns null for unknown or empty', () => {
    expect(normalizeRole(null)).toBeNull()
    expect(normalizeRole('')).toBeNull()
    expect(normalizeRole('guest')).toBeNull()
  })
})

describe('getUserRoleLabel', () => {
  it('uses product labels for canonical and legacy slugs', () => {
    expect(getUserRoleLabel('admin_finanzas')).toBe('Administrador')
    expect(getUserRoleLabel('vendedor')).toBe('Colaborador')
    expect(getUserRoleLabel(USER_ROLES.ADMIN)).toBe('Administrador')
  })
})

describe('isAdminRole', () => {
  it('is true for admin slugs only', () => {
    expect(isAdminRole('admin_finanzas')).toBe(true)
    expect(isAdminRole('vendedor')).toBe(false)
    expect(isAdminRole(USER_ROLES.COLLABORATOR)).toBe(false)
  })
})
