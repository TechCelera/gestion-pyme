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
    console.log('accounts.getCurrentUserCompany: no authenticated user', error?.message)
    return null
  }

  // Try app_metadata.company_id first (from JWT)
  const appMeta = user.app_metadata as any
  if (appMeta?.company_id) {
    console.log('accounts.getCurrentUserCompany: from app_metadata:', appMeta.company_id)
    return appMeta.company_id
  }

  // Fallback: query public.users table (RLS may block this)
  console.log('accounts.getCurrentUserCompany: trying table query for user:', user.id)
  const { data, queryError } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (queryError) {
    console.error('accounts.getCurrentUserCompany: query error:', queryError)
    return null
  }

  return data?.company_id ?? null
}

// ACCOUNT TYPE LABELS
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  bank: 'Bancaria',
  other: 'Otra',
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

// CREATE ACCOUNT
export async function createAccount(input: {
  name: string
  type: string
  currency: string
  balance?: number
}): Promise<ActionResult<Account>> {
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

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        company_id: companyId,
        name: input.name,
        type: input.type,
        currency: input.currency,
        balance: input.balance ?? 0,
      })
      .select('id, name, type, currency, balance')
      .single()

    if (error) {
      console.error('Error creating account:', error)
      return { success: false, error: error.message }
    }

    // Cache will be fresh on next request since we use server actions
    return { success: true, data: data as Account }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}

// UPDATE ACCOUNT
export async function updateAccount(
  id: string,
  input: {
    name?: string
    type?: string
    currency?: string
  }
): Promise<ActionResult<Account>> {
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
    if (input.currency !== undefined) updateData.currency = input.currency

    const { data, error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .select('id, name, type, currency, balance')
      .single()

    if (error) {
      console.error('Error updating account:', error)
      return { success: false, error: error.message }
    }

    // Cache will be fresh on next request since we use server actions
    return { success: true, data: data as Account }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}

// DELETE ACCOUNT (soft delete)
export async function deleteAccount(id: string): Promise<ActionResult> {
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

    // Verificar si la cuenta tiene transacciones asociadas
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', id)
      .is('deleted_at', null)

    if (count && count > 0) {
      return { success: false, error: 'No se puede eliminar una cuenta con transacciones asociadas' }
    }

    const { error } = await supabase
      .from('accounts')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('Error deleting account:', error)
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