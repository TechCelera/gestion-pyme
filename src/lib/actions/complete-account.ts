'use server'

import type { ActionResult } from '@/lib/actions/types'
import { requireAuthenticatedContext } from '@/lib/auth/server-context'
import {
  DEFAULT_BOOTSTRAP_COMPANY_NAME,
  PROFILE_COMPLETED_METADATA_KEY,
} from '@/lib/auth/profile-completion'
import {
  currencyForCountry,
  isSupportedCompanyCountry,
  normalizeCompanyCountry,
} from '@/lib/company-operating-currency'
import { userNeedsProfileCompletion } from '@/lib/auth/server-profile-completion'
import { ROUTES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { validateRegisterCompanyName } from '@/lib/validations/register'
import { validateTermsAccepted } from '@/lib/validations/auth'

export type AccountCompletionPrefill = {
  email: string
  fullName: string
  companyName: string
  country: string
}

export type AccountCompletionStatus = {
  needsCompletion: boolean
  prefill?: AccountCompletionPrefill
}

export async function getAccountCompletionStatus(): Promise<
  ActionResult<AccountCompletionStatus>
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: true, data: { needsCompletion: false } }
    }

    const needsCompletion = await userNeedsProfileCompletion(supabase, user)
    if (!needsCompletion) {
      return { success: true, data: { needsCompletion: false } }
    }

    const prefillResult = await getAccountCompletionPrefill()
    if (!prefillResult.success || !prefillResult.data) {
      return { success: false, error: prefillResult.error ?? 'Error al cargar los datos' }
    }

    return {
      success: true,
      data: { needsCompletion: true, prefill: prefillResult.data },
    }
  } catch (error) {
    console.error('getAccountCompletionStatus error:', error)
    return { success: false, error: 'Error al verificar la cuenta' }
  }
}

export async function getAccountCompletionPrefill(): Promise<
  ActionResult<AccountCompletionPrefill>
> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const meta = user.user_metadata as Record<string, unknown> | undefined
    const metaCountry =
      typeof meta?.country === 'string' ? normalizeCompanyCountry(meta.country) : 'AR'

    const { data: row, error: userError } = await supabase
      .from('users')
      .select('full_name, email, company_id')
      .eq('id', user.id)
      .single()

    if (userError || !row?.company_id) {
      return { success: false, error: userError?.message ?? 'No se encontró el perfil' }
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, country')
      .eq('id', row.company_id)
      .single()

    if (companyError || !company) {
      return { success: false, error: companyError?.message ?? 'No se encontró la empresa' }
    }

    const companyCountry = normalizeCompanyCountry(company.country as string | null)

    return {
      success: true,
      data: {
        email: row.email ?? user.email ?? '',
        fullName: (row.full_name as string)?.trim() || '',
        companyName:
          (company.name as string) === DEFAULT_BOOTSTRAP_COMPANY_NAME
            ? ''
            : ((company.name as string) ?? ''),
        country: companyCountry || metaCountry,
      },
    }
  } catch (error) {
    console.error('getAccountCompletionPrefill error:', error)
    return { success: false, error: 'Error al cargar los datos' }
  }
}

export type CompleteAccountInput = {
  fullName: string
  companyName: string
  country: string
  acceptedTerms: boolean
}

export async function completeAccountAction(
  input: CompleteAccountInput
): Promise<ActionResult<{ redirectTo: string }>> {
  const trimmedName = input.fullName.trim()
  const trimmedCompany = input.companyName.trim()

  const termsError = validateTermsAccepted(input.acceptedTerms)
  if (termsError) {
    return { success: false, error: termsError }
  }

  const companyError = validateRegisterCompanyName(trimmedCompany, false)
  if (companyError) {
    return { success: false, error: companyError }
  }

  if (!trimmedName) {
    return { success: false, error: 'Ingresá tu nombre completo' }
  }

  if (trimmedName.length > 100) {
    return { success: false, error: 'El nombre no puede superar 100 caracteres' }
  }

  const countryCode = input.country.trim().toUpperCase()
  if (!isSupportedCompanyCountry(countryCode)) {
    return { success: false, error: 'País no disponible' }
  }

  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }

    const supabase = await createClient()
    const nextCurrency = currencyForCountry(countryCode)

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ full_name: trimmedName })
      .eq('id', auth.userId)

    if (userUpdateError) {
      return { success: false, error: userUpdateError.message }
    }

    const { error: companyUpdateError } = await supabase
      .from('companies')
      .update({
        name: trimmedCompany,
        country: countryCode,
        currency: nextCurrency,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auth.companyId)

    if (companyUpdateError) {
      return { success: false, error: companyUpdateError.message }
    }

    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
        company_name: trimmedCompany,
        country: countryCode,
        [PROFILE_COMPLETED_METADATA_KEY]: true,
      },
    })

    if (metaError) {
      return { success: false, error: metaError.message }
    }

    return { success: true, data: { redirectTo: ROUTES.DASHBOARD } }
  } catch (error) {
    console.error('completeAccountAction error:', error)
    return { success: false, error: 'No pudimos guardar tus datos. Intentá de nuevo.' }
  }
}
