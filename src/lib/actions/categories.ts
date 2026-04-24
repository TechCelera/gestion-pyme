'use server'

import { createClient } from '@/lib/supabase/server'

// Types
export interface Category {
  id: string
  name: string
  type: string
}

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Helper: obtener companyId del usuario actual
async function getCurrentUserCompany(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    console.log('categories.getCurrentUserCompany: no authenticated user', error?.message)
    return null
  }

  // Try app_metadata.company_id first (from JWT)
  const appMeta = user.app_metadata as any
  if (appMeta?.company_id) {
    console.log('categories.getCurrentUserCompany: from app_metadata:', appMeta.company_id)
    return appMeta.company_id
  }

  // Fallback: query public.users table (RLS may block this)
  console.log('categories.getCurrentUserCompany: trying table query for user:', user.id)
  const { data, error: queryError } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (queryError) {
    console.error('categories.getCurrentUserCompany: query error:', queryError)
    return null
  }

  return data?.company_id ?? null
}

// CATEGORY TYPE LABELS
export const CATEGORY_TYPE_LABELS: Record<string, string> = {
  income: 'Ingreso',
  cost: 'Costo',
  admin_expense: 'Gasto Administrativo',
  commercial_expense: 'Gasto Comercial',
  financial_expense: 'Gasto Financiero',
}

// GET CATEGORIES
export async function getCategories(
  type?: string
): Promise<ActionResult<Category[]>> {
  try {
    const companyId = await getCurrentUserCompany()

    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()

    let query = supabase
      .from('categories')
      .select('id, name, type')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name')

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Category[] }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}

// CREATE CATEGORY
export async function createCategory(input: {
  name: string
  type: string
}): Promise<ActionResult<Category>> {
  try {
    const companyId = await getCurrentUserCompany()

    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('categories')
      .insert({
        company_id: companyId,
        name: input.name,
        type: input.type,
      })
      .select('id, name, type')
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return { success: false, error: error.message }
    }

    // Cache will be fresh on next request since we use server actions
    return { success: true, data: data as Category }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}

// UPDATE CATEGORY
export async function updateCategory(
  id: string,
  input: {
    name?: string
    type?: string
  }
): Promise<ActionResult<Category>> {
  try {
    const companyId = await getCurrentUserCompany()

    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (input.name !== undefined) updateData.name = input.name
    if (input.type !== undefined) updateData.type = input.type

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .select('id, name, type')
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return { success: false, error: error.message }
    }

    // Cache will be fresh on next request since we use server actions
    return { success: true, data: data as Category }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}

// DELETE CATEGORY (soft delete)
export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const companyId = await getCurrentUserCompany()

    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    // Verificar si la categoría tiene transacciones asociadas
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .is('deleted_at', null)

    if (count && count > 0) {
      return { success: false, error: 'No se puede eliminar una categoría con transacciones asociadas' }
    }

    const { error } = await supabase
      .from('categories')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('Error deleting category:', error)
      return { success: false, error: error.message }
    }

    // Cache will be fresh on next request since we use server actions
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}