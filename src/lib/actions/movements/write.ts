'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createMovementSchema,
  updateMovementSchema,
  updateMovementStatusSchema,
  mapMovementComponentsToRpcJson,
  type CreateMovementInput,
  type UpdateMovementInput,
  type UpdateMovementStatusInput,
  type MovementStatus,
} from '@/lib/validations/movement'
import type { ActionResult } from '@/lib/actions/types'
import { isAdminRole } from '@/lib/auth/roles'
import { requireAuthenticatedContext } from '@/lib/auth/server-context'
import { evaluateBudgetStatus } from '@/lib/utils/budget'
import { errorMessageForUser } from '@/lib/utils/errors'
import type { Movement } from './types'
import { mapMovement } from './mappers'
import { getProjectBudgetContext } from './budget'

// CREATE
export async function createMovement(
  input: CreateMovementInput
): Promise<ActionResult<Movement>> {
  try {
    const validated = createMovementSchema.parse(input)
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId, userId } = auth

    const supabase = await createClient()
    
    // Determinar account_id según el tipo
    let accountId = validated.accountId
    if (validated.type === 'transfer') {
      accountId = validated.sourceAccountId
    }

    let requiresBudgetApproval = false
    if (validated.projectId && validated.type === 'expense') {
      const budgetContext = await getProjectBudgetContext(supabase, companyId, validated.projectId)
      if (budgetContext) {
        const budgetState = evaluateBudgetStatus({
          budgetAmount: budgetContext.budgetAmount,
          spentAmount: budgetContext.spentAmount,
          newExpenseAmount: validated.amount,
          endDate: budgetContext.endDate,
          movementDate: validated.date,
        })
        requiresBudgetApproval = budgetState.requiresBudgetApproval
      }
    }

    const { data, error } = await supabase.rpc('create_transaction', {
      p_company_id: companyId,
      p_account_id: accountId,
      p_type: validated.type,
      p_amount: validated.amount,
      p_date: validated.date.toISOString().split('T')[0],
      p_description: validated.description,
      p_category_id: validated.categoryId ?? null,
      p_method: validated.method,
      p_currency: validated.currency,
      p_exchange_rate: 1,
      p_contact_id: validated.contactId ?? null,
      p_contact_type: validated.contactType ?? null,
      p_source_account_id: validated.sourceAccountId ?? null,
      p_destination_account_id: validated.destinationAccountId ?? null,
      p_adjustment_reason: validated.adjustmentReason ?? null,
      p_document_type: validated.documentType ?? null,
      p_document_number: validated.documentNumber ?? null,
      p_attachment_url: validated.attachmentUrl ?? null,
    })

    if (error) {
      console.error('Error creating transaction:', error)
      return { success: false, error: error.message }
    }
    
    // Use RPC to get the full transaction instead of broken PostgREST join
    if (requiresBudgetApproval || validated.projectId || validated.fundOwner === 'client_advance') {
      const updatePayload: Record<string, unknown> = {
        project_id: validated.projectId ?? null,
        fund_owner: validated.fundOwner ?? 'company',
        requires_budget_approval: requiresBudgetApproval,
        updated_at: new Date().toISOString(),
      }

      updatePayload.updated_by = userId

      const { error: patchError } = await supabase
        .from('transactions')
        .update(updatePayload)
        .eq('id', data)
        .eq('company_id', companyId)

      if (patchError) {
        console.error('Error patching movement extra fields:', patchError)
      }
    }

    if (validated.type === 'income' || validated.type === 'expense') {
      const tid = typeof data === 'string' ? data : String(data)
      const { error: compError } = await supabase.rpc('set_operation_components', {
        p_transaction_id: tid,
        p_components: mapMovementComponentsToRpcJson(
          validated.movementComponents ?? [],
          validated.currency ?? 'ARS'
        ),
      })
      if (compError) {
        console.error('Error definición de componentes del movimiento:', compError)
        return { success: false, error: compError.message }
      }
    }

    const { data: createdRow, error: fetchError } = await supabase
      .from('transactions')
      .select(`
        id,
        account_id,
        accounts(name),
        category_id,
        categories(name),
        type,
        status,
        method,
        amount,
        currency,
        date,
        description,
        created_at,
        created_by,
        users(full_name),
        project_id,
        projects(name),
        fund_owner,
        requires_budget_approval
      `)
      .eq('id', data)
      .single()

    if (fetchError || !createdRow) {
      console.error('Error fetching created movimiento:', fetchError)
      return { success: true }
    }

    const mapped = mapMovement(createdRow)

    return { 
      success: true, 
      data: mapped 
    }
  } catch (error) {
    return { success: false, error: errorMessageForUser(error, 'Error al crear el movimiento') }
  }
}
// UPDATE (solo borrador o rechazado — sin impacto en libro hasta reenvío/aprobación)
export async function updateMovement(
  id: string,
  input: Omit<UpdateMovementInput, 'id'>
): Promise<ActionResult<Movement>> {
  try {
    const validated = createMovementSchema.parse(input)
    updateMovementSchema.parse({ ...input, id })

    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId, userId, role } = auth

    const supabase = await createClient()
    const { data: existing, error: fetchErr } = await supabase
      .from('transactions')
      .select('id, status, created_by')
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle()

    if (fetchErr || !existing) {
      return { success: false, error: fetchErr?.message ?? 'Movimiento no encontrado' }
    }

    const status = existing.status as MovementStatus
    if (status !== 'draft' && status !== 'rejected') {
      return {
        success: false,
        error: 'Solo puedes editar borradores o movimientos rechazados.',
      }
    }

    const canEdit = existing.created_by === userId || isAdminRole(role)
    if (!canEdit) {
      return { success: false, error: 'No tienes permiso para editar este movimiento.' }
    }

    let accountId = validated.accountId
    if (validated.type === 'transfer') {
      accountId = validated.sourceAccountId
    }

    let requiresBudgetApproval = false
    if (validated.projectId && validated.type === 'expense') {
      const budgetContext = await getProjectBudgetContext(supabase, companyId, validated.projectId)
      if (budgetContext) {
        const budgetState = evaluateBudgetStatus({
          budgetAmount: budgetContext.budgetAmount,
          spentAmount: budgetContext.spentAmount,
          newExpenseAmount: validated.amount,
          endDate: budgetContext.endDate,
          movementDate: validated.date,
        })
        requiresBudgetApproval = budgetState.requiresBudgetApproval
      }
    }

    const updatePayload: Record<string, unknown> = {
      account_id: accountId,
      type: validated.type,
      amount: validated.amount,
      date: validated.date.toISOString().split('T')[0],
      description: validated.description,
      category_id: validated.categoryId ?? null,
      method: validated.method,
      currency: validated.currency,
      project_id: validated.projectId ?? null,
      fund_owner: validated.fundOwner ?? 'company',
      requires_budget_approval: requiresBudgetApproval,
      updated_at: new Date().toISOString(),
    }

    if (userId) updatePayload.updated_by = userId

    if (validated.type === 'transfer') {
      updatePayload.source_account_id = validated.sourceAccountId ?? null
      updatePayload.destination_account_id = validated.destinationAccountId ?? null
    }
    if (validated.type === 'adjustment') {
      updatePayload.adjustment_reason = validated.adjustmentReason ?? null
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('id', id)
      .eq('company_id', companyId)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return { success: false, error: updateError.message }
    }

    if (validated.type === 'income' || validated.type === 'expense') {
      const { error: compError } = await supabase.rpc('set_operation_components', {
        p_transaction_id: id,
        p_components: mapMovementComponentsToRpcJson(
          validated.movementComponents ?? [],
          validated.currency ?? 'ARS'
        ),
      })
      if (compError) {
        console.error('Error actualizando componentes:', compError)
        return { success: false, error: compError.message }
      }
    }

    const { data: updatedRow, error: rowErr } = await supabase
      .from('transactions')
      .select(`
        id,
        account_id,
        accounts(name),
        category_id,
        categories(name),
        type,
        status,
        method,
        amount,
        currency,
        date,
        description,
        created_at,
        created_by,
        users(full_name),
        project_id,
        projects(name),
        fund_owner,
        requires_budget_approval
      `)
      .eq('id', id)
      .single()

    if (rowErr || !updatedRow) {
      return { success: true }
    }

    return { success: true, data: mapMovement(updatedRow) }
  } catch (error) {
    return { success: false, error: errorMessageForUser(error, 'Error al actualizar el movimiento') }
  }
}
// UPDATE STATUS
export async function updateMovementStatus(
  input: UpdateMovementStatusInput
): Promise<ActionResult> {
  try {
    const validated = updateMovementStatusSchema.parse(input)

    if (
      validated.status === 'approved' ||
      validated.status === 'rejected' ||
      validated.status === 'cancelled'
    ) {
      const auth = await requireAuthenticatedContext()
      if ('error' in auth) {
        return { success: false, error: auth.error }
      }
      if (!isAdminRole(auth.role)) {
        return {
          success: false,
          error:
            'No tienes permiso para esta acción. Solo administración financiera puede aprobar, rechazar o anular.',
        }
      }
    }

    const supabase = await createClient()
    if (validated.status === 'approved') {
      const { data: txn, error: txnError } = await supabase
        .from('transactions')
        .select('requires_budget_approval, budget_approved_by')
        .eq('id', validated.id)
        .single()

      if (txnError) {
        return { success: false, error: txnError.message }
      }

      if (
        txn?.requires_budget_approval === true &&
        !txn?.budget_approved_by
      ) {
        return {
          success: false,
          error:
            'Movimiento con sobrepresupuesto: requiere aprobación adicional antes de aprobar',
        }
      }
    }

    const { error } = await supabase.rpc('update_transaction_status', {
      p_transaction_id: validated.id,
      p_new_status: validated.status,
      p_reason: validated.reason ?? null,
    })

    if (error) {
      console.error('Error updating transaction status:', error)
      return { success: false, error: error.message }
    }

    // revalidateTag('transactions')
    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessageForUser(error, 'Error al actualizar estado') }
  }
}
export type FinalizeSubmissionResult = { status: MovementStatus }

/**
 * Tras crear/enviar un movimiento en estado draft → pending.
 * Un administrador lo aprueba después en la tabla (puede ser otro admin de la empresa).
 */
export async function finalizeMovementSubmission(
  movementId: string
): Promise<ActionResult<FinalizeSubmissionResult>> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }

    const pendingRes = await updateMovementStatus({ id: movementId, status: 'pending' })
    if (!pendingRes.success) {
      return { success: false, error: pendingRes.error }
    }

    return { success: true, data: { status: 'pending' } }
  } catch (error) {
    return { success: false, error: errorMessageForUser(error, 'Error al enviar el movimiento') }
  }
}
// DELETE
export async function deleteMovement(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }

    const supabase = await createClient()

    // Use RPC for soft delete (handles auth.uid() for deleted_by internally)
    const { error } = await supabase.rpc('soft_delete_transaction', {
      p_transaction_id: id,
    })

    if (error) {
      console.error('Error deleting transaction:', error)
      return { success: false, error: error.message }
    }

    // revalidateTag('transactions')
    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessageForUser(error, 'Error al eliminar el movimiento') }
  }
}
export async function approveBudgetException(
  movementId: string,
  note: string
): Promise<ActionResult> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { userId } = auth

    const supabase = await createClient()
    const { error } = await supabase
      .from('transactions')
      .update({
        budget_approved_by: userId,
        budget_approved_at: new Date().toISOString(),
        budget_approval_note: note,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', movementId)
      .eq('requires_budget_approval', true)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessageForUser(error) }
  }
}