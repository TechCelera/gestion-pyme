'use server'

import type { ActionResult } from '@/lib/actions/types'
import { currencyForCountry, isSupportedCompanyCountry, normalizeCompanyCountry } from '@/lib/company-operating-currency'
import { fetchOperatingCurrencyForCompany } from '@/lib/company-operating-currency-server'
import { isAdminRole } from '@/lib/auth/roles'
import { requireAuthenticatedContext } from '@/lib/auth/server-context'
import { createClient } from '@/lib/supabase/server'

export interface CompanySettings {
  companyId: string
  companyName: string
  country: string
  currency: string
  canChangeCountry: boolean
  hasMovements: boolean
}

async function companyHasMovements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .is('deleted_at', null)

  if (error) {
    console.error('companyHasMovements:', error)
    return true
  }
  return (count ?? 0) > 0
}

export async function getCompanySettings(): Promise<ActionResult<CompanySettings>> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

    const supabase = await createClient()
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, country, currency')
      .eq('id', companyId)
      .single()

    if (error || !company) {
      return { success: false, error: error?.message ?? 'No se encontró la empresa' }
    }

    const country = normalizeCompanyCountry(company.country as string | null)
    const currency = currencyForCountry(country)
    const hasMovements = await companyHasMovements(supabase, companyId)

    return {
      success: true,
      data: {
        companyId: company.id as string,
        companyName: (company.name as string) ?? '',
        country,
        currency,
        canChangeCountry: !hasMovements,
        hasMovements,
      },
    }
  } catch (error) {
    console.error('getCompanySettings error:', error)
    return { success: false, error: 'Error al cargar la configuración de la empresa' }
  }
}

export async function updateCompanyCountry(
  country: string
): Promise<ActionResult<CompanySettings>> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    if (!isAdminRole(auth.role)) {
      return { success: false, error: 'Solo un administrador puede cambiar el país de la empresa' }
    }

    const code = country.trim().toUpperCase()
    if (!isSupportedCompanyCountry(code)) {
      return { success: false, error: 'País no disponible' }
    }

    const { companyId } = auth
    const supabase = await createClient()
    const hasMovements = await companyHasMovements(supabase, companyId)
    if (hasMovements) {
      return {
        success: false,
        error:
          'No puedes cambiar el país porque ya hay movimientos registrados. La moneda quedaría inconsistente con el historial.',
      }
    }

    const nextCurrency = currencyForCountry(code)
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        country: code,
        currency: nextCurrency,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return getCompanySettings()
  } catch (error) {
    console.error('updateCompanyCountry error:', error)
    return { success: false, error: 'Error al actualizar el país' }
  }
}

/** Resolves operating currency for the current company (server). */
export async function getCompanyOperatingCurrency(): Promise<ActionResult<string>> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const supabase = await createClient()
    const currency = await fetchOperatingCurrencyForCompany(supabase, auth.companyId)
    return { success: true, data: currency }
  } catch (error) {
    console.error('getCompanyOperatingCurrency error:', error)
    return { success: false, error: 'Error al obtener la moneda' }
  }
}
