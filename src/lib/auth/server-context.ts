import { createClient } from '@/lib/supabase/server'
import { isAdminRole, normalizeRole, type CanonicalUserRole } from '@/lib/auth/roles'
import { readSessionAuthFields } from '@/lib/auth/session-user'

export type AuthenticatedContext = {
  userId: string
  companyId: string
  role: CanonicalUserRole
}

export async function getAuthenticatedContext(): Promise<AuthenticatedContext | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return null

    const fromMeta = readSessionAuthFields(user)
    let companyId = fromMeta.companyId
    let roleSlug = fromMeta.roleSlug

    if (!companyId || !roleSlug) {
      const { data: row, error: queryError } = await supabase
        .from('users')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

      if (queryError || !row?.company_id) return null
      companyId = row.company_id
      roleSlug = row.role
    }

    const role = normalizeRole(roleSlug)
    if (!role || !companyId) return null

    return { userId: user.id, companyId, role }
  } catch {
    return null
  }
}

export async function requireAuthenticatedContext():
  Promise<AuthenticatedContext | { error: string }> {
  const ctx = await getAuthenticatedContext()
  if (!ctx) {
    return { error: 'Usuario no autenticado o sin empresa' }
  }
  return ctx
}

export async function requireAdminContext(): Promise<
  | { ok: true; userId: string; companyId: string }
  | { ok: false; error: string }
> {
  const ctx = await getAuthenticatedContext()
  if (!ctx) {
    return { ok: false, error: 'Usuario no autenticado' }
  }
  if (!isAdminRole(ctx.role)) {
    return { ok: false, error: 'Solo un administrador puede gestionar el equipo' }
  }
  return { ok: true, userId: ctx.userId, companyId: ctx.companyId }
}
