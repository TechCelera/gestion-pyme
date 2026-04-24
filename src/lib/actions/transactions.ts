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
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('getCurrentUserCompany: auth error:', error.message)
      return null
    }

    if (!user) {
      console.log('getCurrentUserCompany: no user found')
      return null
    }

    // 1. Try app_metadata.company_id (from JWT, set by trigger)
    const appMeta = user.app_metadata as Record<string, unknown>
    if (appMeta?.company_id) {
      return appMeta.company_id as string
    }

    // 2. Try user_metadata.company_id (set during signup, available client-side)
    if (user.user_metadata?.company_id) {
      return user.user_metadata.company_id as string
    }

    // 3. Fallback: query public.users table
    const { data, error: queryError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (queryError) {
      console.error('getCurrentUserCompany: query error:', queryError.message)
      return null
    }

    return data?.company_id ?? null
  } catch (error) {
    console.error('getCurrentUserCompany error:', error)
    return null
  }
}

// Helper para obtener userId del usuario actual
async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user.id
  } catch {
    return null
  }
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
    
    // Use RPC to get the full transaction instead of broken PostgREST join
    const { data: transaction, error: fetchError } = await supabase.rpc(
      'get_transaction_by_id',
      { p_transaction_id: data }
    )

    if (fetchError) {
      console.error('Error fetching created transaction:', fetchError)
      // Return success anyway — the transaction was created
      return { success: true }
    }

    const mapped = Array.isArray(transaction) 
      ? transaction.map(mapTransaction)[0] 
      : mapTransaction(transaction)

    return { 
      success: true, 
      data: mapped 
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
    const userId = await getCurrentUserId()
    
    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()

    const updatePayload: Record<string, unknown> = {
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
    }

    // Include updated_by for audit trail (T10)
    if (userId) {
      updatePayload.updated_by = userId
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updatePayload)
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
    const companyId = await getCurrentUserCompany()
    
    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
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
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}

// GET TRANSACTIONS (using RPC)
export async function getTransactions(
  filters: TransactionFilters
): Promise<ActionResult<{ transactions: Transaction[]; total: number }>> {
  try {
    if (!filters || typeof filters !== 'object') {
      return { success: false, error: 'Filtros inválidos' }
    }

    const validated = transactionFiltersSchema.parse(filters)

    const companyId = await getCurrentUserCompany()

    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

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

    console.log('getTransactions RPC result:', { error, dataLength: data?.length })

if (error) {
      console.error('get_transactions RPC error:', error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    const rows = (data || []) as Record<string, unknown>[]
    const total = rows.length > 0 
      ? Number(rows[0].total_count ?? 0) 
      : 0
    const transactions = rows.map(mapTransaction)

    return { 
      success: true, 
      data: { 
        transactions, 
        total 
      } 
    }
  } catch (error) {
    console.error('getTransactions CATCH:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido al cargar transacciones' }
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
    amount: Number(t.amount),
    currency: t.currency as string,
    date: t.date as string,
    description: t.description as string,
    createdAt: t.created_at as string,
    createdBy: t.created_by as string,
    creatorName: (t.users as Record<string, string>)?.full_name ?? (t.creator_name as string) ?? null,
  }
}

// DASHBOARD STATS
export interface DashboardStats {
  totalTransactions: number
  totalIncome: number
  totalExpenses: number
  pendingCount: number
  approvedCount: number
  postedCount: number
  netBalance: number
}

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    const companyId = await getCurrentUserCompany()
    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()

    // Get all transactions for the company
    const { data, error } = await supabase
      .from('transactions')
      .select('type, status, amount')
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (error) {
      return { success: false, error: error.message }
    }

    const transactions = data || []

    const stats: DashboardStats = {
      totalTransactions: transactions.length,
      totalIncome: transactions
        .filter((t: Record<string, unknown>) => t.type === 'income' && t.status === 'posted')
        .reduce((sum: number, t: Record<string, unknown>) => sum + (t.amount as number), 0),
      totalExpenses: transactions
        .filter((t: Record<string, unknown>) => t.type === 'expense' && t.status === 'posted')
        .reduce((sum: number, t: Record<string, unknown>) => sum + (t.amount as number), 0),
      pendingCount: transactions.filter((t: Record<string, unknown>) => t.status === 'pending').length,
      approvedCount: transactions.filter((t: Record<string, unknown>) => t.status === 'approved').length,
      postedCount: transactions.filter((t: Record<string, unknown>) => t.status === 'posted').length,
      netBalance: 0,
    }

    stats.netBalance = stats.totalIncome - stats.totalExpenses

    return { success: true, data: stats }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}// redeploy trigger jue 23 abr 2026 23:18:05 -05
