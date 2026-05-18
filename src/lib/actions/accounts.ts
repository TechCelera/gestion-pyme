'use server'

import type { ActionResult } from '@/lib/actions/types'
import { requireAuthenticatedContext } from '@/lib/auth/server-context'
import { createClient } from '@/lib/supabase/server'

// Types
export interface Account {
  id: string
  name: string
  type: string
  currency: string
  balance: number
}

function normalizeAccountName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function isSemanticCashName(value: string): boolean {
  const normalized = normalizeAccountName(value)
  return ['caja', 'caja principal', 'caja ppal', 'caja general'].includes(normalized)
}

// GET ACCOUNTS
export async function getAccounts(): Promise<ActionResult<Account[]>> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

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

    if (isSemanticCashName(input.name)) {
      const { data: cashAccounts } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('company_id', companyId)
        .is('deleted_at', null)
      const hasCash = (cashAccounts ?? []).some((row) => isSemanticCashName((row.name as string) ?? ''))
      if (hasCash) {
        return { success: false, error: 'Ya existe una única cuenta de caja activa. Usa la cuenta Caja existente.' }
      }
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
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

    const supabase = await createClient()

    if (input.name !== undefined && isSemanticCashName(input.name)) {
      const { data: cashAccounts } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('company_id', companyId)
        .is('deleted_at', null)
      const hasAnotherCash = (cashAccounts ?? []).some((row) => {
        const rowId = (row.id as string) ?? ''
        const rowName = (row.name as string) ?? ''
        return rowId !== id && isSemanticCashName(rowName)
      })
      if (hasAnotherCash) {
        return { success: false, error: 'Solo puede existir una cuenta de caja activa por empresa.' }
      }
    }

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

    // Verificar si la cuenta tiene transacciones asociadas
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', id)
      .is('deleted_at', null)

    if (count && count > 0) {
      return { success: false, error: 'No se puede eliminar una cuenta con movimientos asociados' }
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
