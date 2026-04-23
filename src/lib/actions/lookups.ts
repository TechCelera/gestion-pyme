'use server'

import { createClient } from '@/lib/supabase/server'

// Types
export interface Account {
  id: string
  name: string
  type: string
  currency: string
  balance: number
}

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

// Helper para obtener companyId del usuario actual
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

// GET ACCOUNTS
export async function getAccounts(): Promise<ActionResult<Account[]>> {
  try {
    const companyId = await getCurrentUserCompany()

    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('accounts')
      .select('id, name, type, currency, balance')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name')

    if (error) {
      console.error('Error fetching accounts:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Account[] }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
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