'use server'

import { createClient } from '@/lib/supabase/server'

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

// Datos por defecto para nuevas empresas (PYME colombiana)
const DEFAULT_ACCOUNTS = [
  { name: 'Caja General', type: 'cash', currency: 'COP', balance: 0 },
  { name: 'Bancolombia Corriente', type: 'bank', currency: 'COP', balance: 0 },
  { name: 'Bancolombia Ahorros', type: 'bank', currency: 'COP', balance: 0 },
]

const DEFAULT_CATEGORIES = [
  // Ingresos
  { name: 'Ventas de Productos', type: 'income' },
  { name: 'Ventas de Servicios', type: 'income' },
  { name: 'Otros Ingresos', type: 'income' },
  // Costos
  { name: 'Costo de Mercancía', type: 'cost' },
  // Gastos Administrativos
  { name: 'Nómina', type: 'admin_expense' },
  { name: 'Servicios Públicos', type: 'admin_expense' },
  { name: 'Arriendo', type: 'admin_expense' },
  // Gastos Comerciales
  { name: 'Publicidad y Marketing', type: 'commercial_expense' },
  { name: 'Transporte y Logística', type: 'commercial_expense' },
  // Gastos Financieros
  { name: 'Intereses Bancarios', type: 'financial_expense' },
  { name: 'Comisiones Bancarias', type: 'financial_expense' },
]

/**
 * Siembra cuentas y categorías por defecto para una nueva empresa.
 * Se llama después del registro o desde el dashboard en primer acceso.
 */
export async function seedCompanyDefaults(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const companyId = await getCurrentUserCompany()

    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

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
    const accountsToInsert = DEFAULT_ACCOUNTS.map(acc => ({
      company_id: companyId,
      name: acc.name,
      type: acc.type,
      currency: acc.currency,
      balance: acc.balance,
    }))

    const { error: accountsError } = await supabase
      .from('accounts')
      .insert(accountsToInsert)

    if (accountsError) {
      return { success: false, error: `Error al crear cuentas: ${accountsError.message}` }
    }

    // Insertar categorías por defecto
    const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
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
