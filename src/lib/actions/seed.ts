'use server'

import type { ActionResult } from '@/lib/actions/types'
import { requireAuthenticatedContext } from '@/lib/auth/server-context'
import { createClient } from '@/lib/supabase/server'
import { COUNTRY_CONFIGS } from '@/lib/country-config'

interface SeedSummary {
  accountsCreated: number
  categoriesCreated: number
}

async function getCompanyCountry(companyId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('companies').select('country').eq('id', companyId).single()
  return data?.country ?? null
}

/**
 * Crea cuentas y categorías mínimas por país si faltan (idempotente por nombre).
 * Pensado para empresas nuevas o tablero vacío tras desarrollo.
 */
export async function seedCompanyDefaults(): Promise<ActionResult<SeedSummary>> {
  try {
    const supabase = await createClient()
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

    const country = await getCompanyCountry(companyId)
    const config = COUNTRY_CONFIGS[country ?? 'AR']

    if (!config) {
      return { success: false, error: `Configuración no disponible para país: ${country}` }
    }

    const { data: existingAccounts, error: accountsQueryError } = await supabase
      .from('accounts')
      .select('name')
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (accountsQueryError) {
      return { success: false, error: `Error consultando cuentas: ${accountsQueryError.message}` }
    }

    const { data: existingCategories, error: categoriesQueryError } = await supabase
      .from('categories')
      .select('name')
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (categoriesQueryError) {
      return { success: false, error: `Error consultando categorías: ${categoriesQueryError.message}` }
    }

    const existingAccountNames = new Set((existingAccounts ?? []).map((a) => a.name))
    const existingCategoryNames = new Set((existingCategories ?? []).map((c) => c.name))

    const accountsToInsert = config.accounts
      .filter((a) => !existingAccountNames.has(a.name))
      .map((a) => ({
        company_id: companyId,
        name: a.name,
        type: a.type,
        currency: a.currency,
        balance: 0,
      }))

    const categoriesToInsert = config.categories
      .filter((c) => !existingCategoryNames.has(c.name))
      .map((c) => ({
        company_id: companyId,
        name: c.name,
        type: c.type,
      }))

    if (accountsToInsert.length > 0) {
      const { error: accountsError } = await supabase.from('accounts').insert(accountsToInsert)
      if (accountsError) {
        return { success: false, error: `Error al crear cuentas: ${accountsError.message}` }
      }
    }

    if (categoriesToInsert.length > 0) {
      const { error: categoriesError } = await supabase.from('categories').insert(categoriesToInsert)
      if (categoriesError) {
        return { success: false, error: `Error al crear categorías: ${categoriesError.message}` }
      }
    }

    return {
      success: true,
      data: {
        accountsCreated: accountsToInsert.length,
        categoriesCreated: categoriesToInsert.length,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al sembrar datos',
    }
  }
}
