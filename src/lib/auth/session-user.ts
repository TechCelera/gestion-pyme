import type { User } from '@supabase/supabase-js'
import { normalizeRole, USER_ROLES, type CanonicalUserRole } from '@/lib/auth/roles'

export type SessionAuthFields = {
  roleSlug: string | null
  companyId: string
  fullName: string
}

export type AuthStoreUser = {
  id: string
  email: string
  companyId: string
  role: CanonicalUserRole
  fullName: string
}

function readMetaString(
  meta: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = meta?.[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

/** Reads role/company from JWT metadata (app_metadata first, then user_metadata). */
export function readSessionAuthFields(user: User): SessionAuthFields {
  const appMeta = user.app_metadata as Record<string, unknown> | undefined
  const userMeta = user.user_metadata as Record<string, unknown> | undefined

  const roleSlug =
    readMetaString(appMeta, 'role') ?? readMetaString(userMeta, 'role')

  const companyId =
    readMetaString(appMeta, 'company_id') ??
    readMetaString(userMeta, 'company_id') ??
    ''

  const fullName =
    readMetaString(userMeta, 'full_name') ??
    readMetaString(appMeta, 'full_name') ??
    ''

  return { roleSlug, companyId, fullName }
}

export function mapSessionToAuthStoreUser(
  user: User,
  overrides?: Partial<Pick<AuthStoreUser, 'role' | 'companyId' | 'fullName'>>
): AuthStoreUser | null {
  const { roleSlug, companyId, fullName } = readSessionAuthFields(user)
  const role = overrides?.role ?? normalizeRole(roleSlug)
  if (!role) return null

  return {
    id: user.id,
    email: user.email ?? '',
    companyId: overrides?.companyId ?? companyId,
    role,
    fullName: overrides?.fullName ?? fullName,
  }
}

export function mergeProfileIntoAuthUser(
  sessionUser: User,
  profile: {
    role: string
    companyId: string
    fullName: string
    email: string
  }
): AuthStoreUser {
  const fromSession = readSessionAuthFields(sessionUser)
  const role =
    normalizeRole(profile.role) ??
    normalizeRole(fromSession.roleSlug) ??
    USER_ROLES.ADMIN

  return {
    id: sessionUser.id,
    email: profile.email || sessionUser.email || '',
    companyId: profile.companyId || fromSession.companyId,
    role,
    fullName: profile.fullName || fromSession.fullName,
  }
}
