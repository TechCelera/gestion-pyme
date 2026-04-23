'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFiltersSchema,
  updateTransactionStatusSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionFilters,
  type UpdateTransactionStatusInput,
  type TransactionStatus,
} from '@/lib/validations/transaction'

// Types
export interface Transaction {
  id: string
  accountId: string
  accountName: string
  categoryId: string | null
  categoryName: string | null
  type: 'income' | 'expense' | 'transfer' | 'adjustment'
  status: TransactionStatus
  method: string
  amount: number
  currency: string
  date: string
  description: string
  createdAt: string
  createdBy: string
  creatorName: string | null
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

// CREATE
export async function createTransaction(
  input: CreateTransactionInput
): Promise<ActionResult<Transaction>> {
  try {
    const validated = createTransactionSchema.parse(input)
    const companyId = await getCurrentUserCompany()
    
    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()
    
    // Determinar account_id según el tipo
    let accountId = validated.accountId
    if (validated.type === 'transfer') {
      accountId = validated.sourceAccountId
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

    // revalidateTag('transactions')
    
    // Obtener la transacción creada
    const { data: transaction } = await supabase
      .from('transactions')
      .select(`
        id,
        account_id,
        accounts(name),
        category_id,
        categories(name),
        type,
        status,
        amount,
        currency,
        date,
        description,
        created_at,
        created_by,
        users(full_name)
      `)
      .eq('id', data)
      .single()

    return { 
      success: true, 
      data: transaction ? mapTransaction(transaction) : undefined 
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}

// UPDATE
export async function updateTransaction(
  id: string,
  input: Omit<UpdateTransactionInput, 'id'>
): Promise<ActionResult<Transaction>> {
  try {
    const validated = updateTransactionSchema.parse({ ...input, id })
    const companyId = await getCurrentUserCompany()
    
    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('transactions')
      .update({
        account_id: validated.accountId,
        category_id: validated.categoryId,
        type: validated.type,
        amount: validated.amount,
        date: validated.date?.toISOString().split('T')[0],
        description: validated.description,
        method: validated.method,
        currency: validated.currency,
        contact_id: validated.contactId,
        contact_type: validated.contactType,
        source_account_id: validated.sourceAccountId,
        destination_account_id: validated.destinationAccountId,
        adjustment_reason: validated.adjustmentReason,
        document_type: validated.documentType,
        document_number: validated.documentNumber,
        attachment_url: validated.attachmentUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'draft') // Solo se puede editar si está en draft
      .select(`
        id,
        account_id,
        accounts(name),
        category_id,
        categories(name),
        type,
        status,
        amount,
        currency,
        date,
        description,
        created_at,
        created_by,
        users(full_name)
      `)
      .single()

    if (error) {
      console.error('Error updating transaction:', error)
      return { success: false, error: error.message }
    }

    // revalidateTag('transactions')
    return { success: true, data: mapTransaction(data) }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}

// UPDATE STATUS
export async function updateTransactionStatus(
  input: UpdateTransactionStatusInput
): Promise<ActionResult> {
  try {
    const validated = updateTransactionStatusSchema.parse(input)
    
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('update_transaction_status', {
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
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}

// DELETE
export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('transactions')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', id)
      .eq('status', 'draft') // Solo se puede eliminar si está en draft

    if (error) {
      console.error('Error deleting transaction:', error)
      return { success: false, error: error.message }
    }

    // revalidateTag('transactions')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}

// GET TRANSACTIONS
export async function getTransactions(
  filters: TransactionFilters
): Promise<ActionResult<{ transactions: Transaction[]; total: number }>> {
  try {
    const validated = transactionFiltersSchema.parse(filters)
    const companyId = await getCurrentUserCompany()
    
    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_transactions', {
      p_company_id: companyId,
      p_status: validated.status ?? null,
      p_type: validated.type ?? null,
      p_date_from: validated.dateFrom?.toISOString().split('T')[0] ?? null,
      p_date_to: validated.dateTo?.toISOString().split('T')[0] ?? null,
      p_account_id: validated.accountId ?? null,
      p_category_id: validated.categoryId ?? null,
      p_search: validated.search ?? null,
      p_limit: validated.pageSize,
      p_offset: (validated.page - 1) * validated.pageSize,
    })

    if (error) {
      console.error('Error fetching transactions:', error)
      return { success: false, error: error.message }
    }

    // Obtener conteo total
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .is('deleted_at', null)

    const transactions = (data || []).map(mapTransaction)

    return { 
      success: true, 
      data: { 
        transactions, 
        total: count ?? 0 
      } 
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}

// Helper para mapear transacción
function mapTransaction(raw: unknown): Transaction {
  const t = raw as Record<string, unknown>
  return {
    id: t.id as string,
    accountId: t.account_id as string,
    accountName: (t.accounts as Record<string, string>)?.name ?? (t.account_name as string) ?? '',
    categoryId: t.category_id as string | null,
    categoryName: (t.categories as Record<string, string>)?.name ?? (t.category_name as string) ?? null,
    type: t.type as 'income' | 'expense' | 'transfer' | 'adjustment',
    status: t.status as TransactionStatus,
    method: (t.method as string) || 'cash',
    amount: t.amount as number,
    currency: t.currency as string,
    date: t.date as string,
    description: t.description as string,
    createdAt: t.created_at as string,
    createdBy: t.created_by as string,
    creatorName: (t.users as Record<string, string>)?.full_name ?? (t.creator_name as string) ?? null,
  }
}
