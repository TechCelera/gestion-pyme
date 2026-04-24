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
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // 1. Try app_metadata.company_id (from JWT, set by trigger)
    const appMeta = user.app_metadata as Record<string, unknown>
    if (appMeta?.company_id) {
      return appMeta.company_id as string
    }

    // 2. Try user_metadata.company_id (set during signup)
    if (user.user_metadata?.company_id) {
      return user.user_metadata.company_id as string
    }

    // 3. Fallback: query public.users table
    const { data, error: queryError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (queryError) {
      return null
    }

    return data?.company_id ?? null
  } catch {
    return null
  }
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
 * Siembra categorías por defecto según el país de la empresa.
 * Las cuentas se crean manualmente por el usuario desde Configuración.
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

    // Verificar si ya tiene categorías (para no sembrar dos veces)
    const { count: existingCategories } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (existingCategories && existingCategories > 0) {
      return { success: true, error: 'La empresa ya tiene categorías configuradas' }
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
