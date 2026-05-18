'use server'

import type { ActionResult } from '@/lib/actions/types'
import { requireAuthenticatedContext } from '@/lib/auth/server-context'
import { createClient } from '@/lib/supabase/server'
import {
  createCategorySchema,
  updateCategorySchema,
  normalizeCategoryType,
  type CategoryType,
} from '@/lib/validations/category'

export interface Category {
  id: string
  name: string
  type: CategoryType
}

// GET CATEGORIES
export async function getCategories(
  type?: string
): Promise<ActionResult<Category[]>> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

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

    const rows = (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      type: normalizeCategoryType(row.type as string),
    }))

    return { success: true, data: rows }
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
  type: CategoryType
}): Promise<ActionResult<Category>> {
  try {
    const parsed = createCategorySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }

    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('categories')
      .insert({
        company_id: companyId,
        name: parsed.data.name,
        type: parsed.data.type,
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
    type?: CategoryType
  }
): Promise<ActionResult<Category>> {
  try {
    const parsed = updateCategorySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }

    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type

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
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

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
      return { success: false, error: 'No se puede eliminar una categoría con movimientos asociados' }
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
