import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import {
  DEFAULT_BOOTSTRAP_COMPANY_NAME,
  needsProfileCompletionFromUser,
  resolveCompanyNeedsCompletion,
} from '@/lib/auth/profile-completion'
import { readSessionAuthFields } from '@/lib/auth/session-user'

/** Evalúa en servidor si el usuario debe completar datos de registro (p. ej. tras Google). */
export async function userNeedsProfileCompletion(
  supabase: SupabaseClient,
  user: User
): Promise<boolean> {
  if (!needsProfileCompletionFromUser(user)) {
    return false
  }

  const { companyId } = readSessionAuthFields(user)
  if (!companyId) {
    return true
  }

  const { data: company, error } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .maybeSingle()

  if (error || !company) {
    return true
  }

  return resolveCompanyNeedsCompletion(company.name as string | null)
}

export { DEFAULT_BOOTSTRAP_COMPANY_NAME }
