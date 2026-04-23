'use server'

import { createClient } from '@/lib/supabase/server'
import { COUNTRY_CONFIGS } from '@/lib/country-config'

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Helper: obtener companyId del usuario actual
async function getCurrentUserCompany(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  return data?.company_id ?? null
}

// Helper: obtener país de la empresa
async function getCompanyCountry(companyId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('companies')
    .select('country')
    .eq('id', companyId)
    .single()

  return data?.country ?? null
}

/**
 * Siembra cuentas y categorías por defecto según el país de la empresa.
 * Se llama después del registro o desde el dashboard en primer acceso.
 */
export async function seedCompanyDefaults(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const companyId = await getCurrentUserCompany()

    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    // Obtener país de la empresa
    const country = await getCompanyCountry(companyId)
    const config = COUNTRY_CONFIGS[country ?? 'AR'] // Default Argentina si no hay país

    if (!config) {
      return { success: false, error: `Configuración no disponible para país: ${country}` }
    }

    // Verificar si ya tiene cuentas (para no sembrar dos veces)
    const { count: existingAccounts } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (existingAccounts && existingAccounts > 0) {
      return { success: true, error: 'La empresa ya tiene cuentas configuradas' }
    }

    // Insertar cuentas por defecto
    const accountsToInsert = config.accounts.map(acc => ({
      company_id: companyId,
      name: acc.name,
      type: acc.type,
      currency: acc.currency,
      balance: 0,
    }))

    const { error: accountsError } = await supabase
      .from('accounts')
      .insert(accountsToInsert)

    if (accountsError) {
      return { success: false, error: `Error al crear cuentas: ${accountsError.message}` }
    }

    // Insertar categorías por defecto
    const categoriesToInsert = config.categories.map(cat => ({
      company_id: companyId,
      name: cat.name,
      type: cat.type,
    }))

    const { error: categoriesError } = await supabase
      .from('categories')
      .insert(categoriesToInsert)

    if (categoriesError) {
      return { success: false, error: `Error al crear categorías: ${categoriesError.message}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al sembrar datos',
    }
  }
}
