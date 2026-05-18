'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/types'
import { getAuthenticatedContext, requireAuthenticatedContext } from '@/lib/auth/server-context'
import { errorMessageForUser } from '@/lib/utils/errors'

// DASHBOARD STATS
export interface DashboardStats {
  totalMovements: number
  totalIncome: number
  totalExpenses: number
  pendingCount: number
  approvedCount: number
  netBalance: number
}

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('transactions')
      .select('type, status, amount')
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (error) {
      return { success: false, error: error.message }
    }

    const movementRows = data || []

    const stats: DashboardStats = {
      totalMovements: movementRows.length,
      totalIncome: movementRows
        .filter((t: Record<string, unknown>) => t.type === 'income' && t.status === 'approved')
        .reduce((sum: number, t: Record<string, unknown>) => sum + (t.amount as number), 0),
      totalExpenses: movementRows
        .filter((t: Record<string, unknown>) => t.type === 'expense' && t.status === 'approved')
        .reduce((sum: number, t: Record<string, unknown>) => sum + (t.amount as number), 0),
      pendingCount: movementRows.filter((t: Record<string, unknown>) => t.status === 'pending').length,
      approvedCount: movementRows.filter((t: Record<string, unknown>) => t.status === 'approved').length,
      netBalance: 0,
    }

    stats.netBalance = stats.totalIncome - stats.totalExpenses

    return { success: true, data: stats }
  } catch (error) {
    return { success: false, error: errorMessageForUser(error) }
  }
}

/** Conteo de movimientos pendientes de aprobación (sidebar / layout). */
export async function getPendingMovementsCount(): Promise<ActionResult<number>> {
  try {
    const ctx = await getAuthenticatedContext()
    if (!ctx) {
      return { success: true, data: 0 }
    }

    const supabase = await createClient()
    const { count, error } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', ctx.companyId)
      .eq('status', 'pending')
      .is('deleted_at', null)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: count ?? 0 }
  } catch (error) {
    return { success: false, error: errorMessageForUser(error) }
  }
}