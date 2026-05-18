'use server'

import { createClient } from '@/lib/supabase/server'
import { movementFiltersSchema, type MovementFilters } from '@/lib/validations/movement'
import type { ActionResult } from '@/lib/actions/types'
import { requireAuthenticatedContext } from '@/lib/auth/server-context'
import { errorMessageForUser } from '@/lib/utils/errors'
import type { Movement, MovementComponentDTO, MovementDetail } from './types'
import { mapMovement, mapMovementDetail } from './mappers'

export async function getMovementComponents(
  movementId: string
): Promise<ActionResult<MovementComponentDTO[]>> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

    const supabase = await createClient()
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', movementId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (txErr || !tx) {
      return { success: false, error: txErr?.message ?? 'Movimiento no encontrado' }
    }

    const { data: rows, error } = await supabase
      .from('operation_components')
      .select('id, component_type, account_id, contact_id, amount, currency')
      .eq('transaction_id', movementId)
      .order('created_at', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const mapped: MovementComponentDTO[] = (rows ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string | undefined,
      componentType: r.component_type as MovementComponentDTO['componentType'],
      accountId: (r.account_id as string | null) ?? undefined,
      contactId: (r.contact_id as string | null) ?? undefined,
      amount: Number(r.amount ?? 0),
      currency: (r.currency as string | undefined) ?? undefined,
    }))

    return { success: true, data: mapped }
  } catch (e) {
    return { success: false, error: errorMessageForUser(e) }
  }
}
export async function getMovementById(id: string): Promise<ActionResult<MovementDetail>> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

    const supabase = await createClient()
    const { data: rows, error } = await supabase.rpc('get_transaction_by_id', {
      p_transaction_id: id,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    const rpcRow = (Array.isArray(rows) ? rows[0] : rows) as Record<string, unknown> | null
    if (!rpcRow?.id) {
      return { success: false, error: 'Movimiento no encontrado' }
    }

    if (rpcRow.company_id !== companyId) {
      return { success: false, error: 'Movimiento no encontrado' }
    }

    const { data: extra, error: extraErr } = await supabase
      .from('transactions')
      .select(
        `
        project_id,
        projects(name),
        fund_owner,
        requires_budget_approval,
        budget_approved_by,
        budget_approval_note,
        cancellation_reason
      `
      )
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle()

    if (extraErr) {
      return { success: false, error: extraErr.message }
    }

    return { success: true, data: mapMovementDetail(rpcRow, extra as Record<string, unknown> | null) }
  } catch (e) {
    return { success: false, error: errorMessageForUser(e, 'Error al cargar el movimiento') }
  }
}
// LIST MOVEMENTS (RPC get_transactions)
export async function listMovements(
  filters: MovementFilters
): Promise<ActionResult<{ movements: Movement[]; total: number }>> {
  try {
    if (!filters || typeof filters !== 'object') {
      return { success: false, error: 'Filtros inválidos' }
    }

    const validated = movementFiltersSchema.parse(filters)

    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_transactions', {
      p_company_id: companyId,
      p_status: validated.status?.length ? validated.status : null,
      p_type: validated.type?.length ? validated.type : null,
      p_date_from: validated.dateFrom
        ? validated.dateFrom.toISOString().split('T')[0]
        : null,
      p_date_to: validated.dateTo
        ? validated.dateTo.toISOString().split('T')[0]
        : null,
      p_account_id: validated.accountId ?? null,
      p_category_id: validated.categoryId ?? null,
      p_contact_id: null,
      p_search: validated.search ?? null,
      p_limit: validated.pageSize,
      p_offset: (validated.page - 1) * validated.pageSize,
    })

    if (error) {
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    const rows = (data || []) as Record<string, unknown>[]
    const total = rows.length > 0 
      ? Number(rows[0].total_count ?? 0) 
      : 0
    const movements = rows.map(mapMovement)

    return { 
      success: true, 
      data: { 
        movements, 
        total 
      } 
    }
  } catch (error) {
    return {
      success: false,
      error: errorMessageForUser(error, 'Error desconocido al cargar movimientos'),
    }
  }
}