import type { User } from '@supabase/supabase-js'

import {
  buildAuthCompletarReturnPath,
  type AuthCompletionSurface,
} from '@/lib/auth/auth-completion-routes'
import { ROUTES } from '@/lib/constants'

/** Nombre por defecto del trigger `handle_new_user` cuando no hay `company_name` en metadata. */
export const DEFAULT_BOOTSTRAP_COMPANY_NAME = 'Mi Empresa'

export const PROFILE_COMPLETED_METADATA_KEY = 'profile_completed'

function readMetaString(
  meta: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = meta?.[key]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export function isProfileCompletedInMetadata(user: User): boolean {
  const meta = user.user_metadata as Record<string, unknown> | undefined
  return meta?.[PROFILE_COMPLETED_METADATA_KEY] === true
}

export function hasCompanyNameInMetadata(user: User): boolean {
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const name = readMetaString(meta, 'company_name')
  return Boolean(name && name !== DEFAULT_BOOTSTRAP_COMPANY_NAME)
}

/** Heurística en JWT: falta completar si no marcó perfil y no registró nombre de empresa. */
export function needsProfileCompletionFromUser(user: User): boolean {
  if (isProfileCompletedInMetadata(user)) return false
  if (hasCompanyNameInMetadata(user)) return false
  return true
}

export function resolveCompanyNeedsCompletion(companyName: string | null | undefined): boolean {
  const trimmed = companyName?.trim() ?? ''
  return trimmed.length === 0 || trimmed === DEFAULT_BOOTSTRAP_COMPANY_NAME
}

export function resolvePostAuthPath(
  needsCompletion: boolean,
  requestedNext: string,
  surface: AuthCompletionSurface = 'login'
): string {
  if (needsCompletion) {
    const safeNext =
      requestedNext.startsWith('/') && !requestedNext.startsWith('//')
        ? requestedNext
        : ROUTES.DASHBOARD
    return buildAuthCompletarReturnPath(surface, safeNext)
  }
  return requestedNext.startsWith('/') ? requestedNext : ROUTES.DASHBOARD
}
