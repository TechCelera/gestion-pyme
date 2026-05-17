import type { Session } from '@supabase/supabase-js'
import { getProfile } from '@/lib/actions/profile'
import { USER_ROLES } from '@/lib/auth/roles'
import {
  mapSessionToAuthStoreUser,
  mergeProfileIntoAuthUser,
  readSessionAuthFields,
  type AuthStoreUser,
} from '@/lib/auth/session-user'

/** Resolves store user from DB profile, then JWT metadata. Never maps to legacy vendedor. */
export async function hydrateAuthStoreUser(session: Session): Promise<AuthStoreUser> {
  const profileResult = await getProfile()
  if (profileResult.success && profileResult.data) {
    const p = profileResult.data
    return mergeProfileIntoAuthUser(session.user, {
      role: p.role,
      companyId: p.companyId,
      fullName: p.fullName,
      email: p.email,
    })
  }

  const fromSession = mapSessionToAuthStoreUser(session.user)
  if (fromSession) return fromSession

  const fields = readSessionAuthFields(session.user)
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    companyId: fields.companyId,
    role: USER_ROLES.ADMIN,
    fullName: fields.fullName,
  }
}
