import { describe, expect, it } from 'vitest'
import type { User } from '@supabase/supabase-js'
import {
  mapSessionToAuthStoreUser,
  mergeProfileIntoAuthUser,
  readSessionAuthFields,
} from '@/lib/auth/session-user'
import { USER_ROLES } from '@/lib/auth/roles'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'owner@test.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
    ...overrides,
  } as User
}

describe('readSessionAuthFields', () => {
  it('prefers app_metadata over user_metadata', () => {
    const user = makeUser({
      app_metadata: { role: 'admin_finanzas', company_id: 'co-app' },
      user_metadata: { role: 'vendedor', company_id: 'co-user', full_name: 'Ana' },
    })
    expect(readSessionAuthFields(user)).toEqual({
      roleSlug: 'admin_finanzas',
      companyId: 'co-app',
      fullName: 'Ana',
    })
  })

  it('falls back to user_metadata when app_metadata is empty', () => {
    const user = makeUser({
      user_metadata: { role: 'vendedor', company_id: 'co-1', full_name: 'Luis' },
    })
    expect(readSessionAuthFields(user).roleSlug).toBe('vendedor')
  })
})

describe('mapSessionToAuthStoreUser', () => {
  it('returns null when role cannot be resolved from session', () => {
    const user = makeUser()
    expect(mapSessionToAuthStoreUser(user)).toBeNull()
  })

  it('normalizes role from app_metadata', () => {
    const user = makeUser({
      app_metadata: { role: 'admin_finanzas', company_id: 'co-1' },
      user_metadata: { full_name: 'Owner' },
    })
    expect(mapSessionToAuthStoreUser(user)).toMatchObject({
      role: USER_ROLES.ADMIN,
      companyId: 'co-1',
      fullName: 'Owner',
    })
  })

  it('does not default to vendedor', () => {
    const user = makeUser({ user_metadata: { company_id: 'co-1' } })
    expect(mapSessionToAuthStoreUser(user)).toBeNull()
  })
})

describe('mergeProfileIntoAuthUser', () => {
  it('uses profile role when session metadata is missing', () => {
    const user = makeUser()
    const merged = mergeProfileIntoAuthUser(user, {
      role: 'admin_finanzas',
      companyId: 'co-db',
      fullName: 'From DB',
      email: 'owner@test.com',
    })
    expect(merged.role).toBe(USER_ROLES.ADMIN)
    expect(merged.companyId).toBe('co-db')
    expect(merged.fullName).toBe('From DB')
  })

  it('defaults to admin when profile role is unknown', () => {
    const user = makeUser()
    const merged = mergeProfileIntoAuthUser(user, {
      role: 'unknown',
      companyId: 'co-db',
      fullName: '',
      email: '',
    })
    expect(merged.role).toBe(USER_ROLES.ADMIN)
  })
})
