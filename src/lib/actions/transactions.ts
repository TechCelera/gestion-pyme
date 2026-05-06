'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFiltersSchema,
  updateTransactionStatusSchema,
  mapOperationComponentsToRpcJson,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionFilters,
  type UpdateTransactionStatusInput,
  type TransactionStatus,
  type FundOwner,
  type OperationComponentRow,
} from '@/lib/validations/transaction'
import { evaluateBudgetStatus } from '@/lib/utils/budget'

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
  projectId?: string | null
  projectName?: string | null
  fundOwner?: FundOwner
  requiresBudgetApproval?: boolean
}

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface OperationComponentDTO extends OperationComponentRow {
  id?: string
}

export async function getOperationComponents(
  transactionId: string
): Promise<ActionResult<OperationComponentDTO[]>> {
  try {
    const companyId = await getCurrentUserCompany()
    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', transactionId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (txErr || !tx) {
      return { success: false, error: txErr?.message ?? 'Operación no encontrada' }
    }

    const { data: rows, error } = await supabase
      .from('operation_components')
      .select('id, component_type, account_id, contact_id, amount, currency')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const mapped: OperationComponentDTO[] = (rows ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string | undefined,
      componentType: r.component_type as OperationComponentDTO['componentType'],
      accountId: (r.account_id as string | null) ?? undefined,
      contactId: (r.contact_id as string | null) ?? undefined,
      amount: Number(r.amount ?? 0),
      currency: (r.currency as string | undefined) ?? undefined,
    }))

    return { success: true, data: mapped }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

interface ProjectBudgetContext {
  id: string
  budgetAmount: number
  endDate: string | null
  spentAmount: number
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

/** Un solo medio de pago (cartera) alineado al motor contable vía `set_operation_components`. */
async function syncSingleWalletOperationComponents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  transactionId: string,
  accountId: string,
  amount: number,
  currency: string
): Promise<{ error: { message: string } | null }> {
  const { data: accRow, error: accErr } = await supabase
    .from('accounts')
    .select('type')
    .eq('id', accountId)
    .single()

  if (accErr || !accRow) {
    return { error: { message: accErr?.message ?? 'Cuenta operativa no encontrada' } }
  }

  const accType = (accRow as { type?: string }).type
  const compType = accType === 'cash' ? 'operative_cash' : 'operative_bank'

  const { error } = await supabase.rpc('set_operation_components', {
    p_transaction_id: transactionId,
    p_components: [
      {
        component_type: compType,
        account_id: accountId,
        amount,
        currency: currency || 'ARS',
      },
    ],
  })

  return { error }
}

async function getProjectBudgetContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  projectId: string
): Promise<ProjectBudgetContext | null> {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, budget_amount, end_date')
    .eq('id', projectId)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .single()

  if (projectError || !project) {
    return null
  }

  const { data: txRows, error: txError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('company_id', companyId)
    .eq('project_id', projectId)
    .eq('type', 'expense')
    .eq('status', 'posted')
    .is('deleted_at', null)

  if (txError) {
    return null
  }

  const spentAmount = (txRows ?? []).reduce((acc, row) => {
    const amount = Number((row as Record<string, unknown>).amount ?? 0)
    return acc + amount
  }, 0)

  return {
    id: project.id as string,
    budgetAmount: Number(project.budget_amount ?? 0),
    endDate: (project.end_date as string | null) ?? null,
    spentAmount,
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

    let requiresBudgetApproval = false
    if (validated.projectId && validated.type === 'expense') {
      const budgetContext = await getProjectBudgetContext(supabase, companyId, validated.projectId)
      if (budgetContext) {
        const budgetState = evaluateBudgetStatus({
          budgetAmount: budgetContext.budgetAmount,
          spentAmount: budgetContext.spentAmount,
          newExpenseAmount: validated.amount,
          endDate: budgetContext.endDate,
          operationDate: validated.date,
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

      const userId = await getCurrentUserId()
      if (userId) updatePayload.updated_by = userId

      const { error: patchError } = await supabase
        .from('transactions')
        .update(updatePayload)
        .eq('id', data)
        .eq('company_id', companyId)

      if (patchError) {
        console.error('Error patching operation extra fields:', patchError)
      }
    }

    if (validated.type === 'income' || validated.type === 'expense') {
      const tid = typeof data === 'string' ? data : String(data)
      if (validated.operationComponents && validated.operationComponents.length > 0) {
        const { error: compError } = await supabase.rpc('set_operation_components', {
          p_transaction_id: tid,
          p_components: mapOperationComponentsToRpcJson(
            validated.operationComponents,
            validated.currency ?? 'ARS'
          ),
        })
        if (compError) {
          console.error('Error definición de componentes de operación:', compError)
          return { success: false, error: compError.message }
        }
      } else {
        const { error: compError } = await syncSingleWalletOperationComponents(
          supabase,
          tid,
          accountId,
          validated.amount,
          validated.currency ?? 'ARS'
        )
        if (compError) {
          console.error('Error definición de componentes de operación:', compError)
          return { success: false, error: compError.message }
        }
      }
    }

    const { data: transaction, error: fetchError } = await supabase
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

    if (fetchError || !transaction) {
      console.error('Error fetching created transaction:', fetchError)
      return { success: true }
    }

    const mapped = mapTransaction(transaction)

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
      project_id: validated.projectId ?? null,
      fund_owner: validated.fundOwner ?? 'company',
      updated_at: new Date().toISOString(),
    }

    if (validated.projectId && validated.type === 'expense' && validated.amount !== undefined) {
      const budgetContext = await getProjectBudgetContext(supabase, companyId, validated.projectId)
      if (budgetContext) {
        const budgetState = evaluateBudgetStatus({
          budgetAmount: budgetContext.budgetAmount,
          spentAmount: budgetContext.spentAmount,
          newExpenseAmount: validated.amount,
          endDate: budgetContext.endDate,
          operationDate: validated.date ?? new Date(),
        })
        updatePayload.requires_budget_approval = budgetState.requiresBudgetApproval
      }
    }

    // Include updated_by for audit trail (T10)
    if (userId) {
      updatePayload.updated_by = userId
    }

    const { error } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('id', id)
      .eq('status', 'draft') // Solo se puede editar si está en draft

    if (error) {
      console.error('Error updating transaction:', error)
      return { success: false, error: error.message }
    }

    const { data: rowAfter } = await supabase
      .from('transactions')
      .select('type, account_id, amount, currency')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (
      rowAfter &&
      ((rowAfter as { type?: string }).type === 'income' ||
        (rowAfter as { type?: string }).type === 'expense')
    ) {
      const r = rowAfter as {
        account_id: string
        amount: number | string
        currency?: string | null
      }
      const cur = (validated.currency as string | undefined) ?? r.currency ?? 'ARS'
      if (validated.operationComponents && validated.operationComponents.length > 0) {
        const { error: compError } = await supabase.rpc('set_operation_components', {
          p_transaction_id: id,
          p_components: mapOperationComponentsToRpcJson(validated.operationComponents, cur),
        })
        if (compError) {
          return { success: false, error: compError.message }
        }
      } else {
        const { error: compError } = await syncSingleWalletOperationComponents(
          supabase,
          id,
          r.account_id,
          Number(r.amount),
          cur
        )
        if (compError) {
          return { success: false, error: compError.message }
        }
      }
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

// UPDATE STATUS
export async function updateTransactionStatus(
  input: UpdateTransactionStatusInput
): Promise<ActionResult> {
  try {
    const validated = updateTransactionStatusSchema.parse(input)
    
    const supabase = await createClient()
    if (validated.status === 'posted') {
      const { data: operation, error: operationError } = await supabase
        .from('transactions')
        .select('requires_budget_approval, budget_approved_by')
        .eq('id', validated.id)
        .single()

      if (operationError) {
        return { success: false, error: operationError.message }
      }

      if (
        operation?.requires_budget_approval === true &&
        !operation?.budget_approved_by
      ) {
        return {
          success: false,
          error: 'Operación con sobrepresupuesto: requiere aprobación adicional antes de contabilizar',
        }
      }
    }

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
    return { success: false, error: 'Error desconocido al cargar operaciones' }
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
    projectId: (t.project_id as string) ?? null,
    projectName: (t.projects as Record<string, string>)?.name ?? (t.project_name as string) ?? null,
    fundOwner: ((t.fund_owner as FundOwner) ?? 'company'),
    requiresBudgetApproval: Boolean(t.requires_budget_approval),
  }
}

export async function approveBudgetException(
  operationId: string,
  note: string
): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Usuario no autenticado' }
    }

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
      .eq('id', operationId)
      .eq('requires_budget_approval', true)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
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
}

export interface IncomeStatementReport {
  periodLabel: string
  totalIncome: number
  totalExpenses: number
  netProfit: number
  marginPercent: number
  expenseBreakdown: Array<{
    category: string
    amount: number
  }>
}

export interface CashFlowReport {
  periodLabel: string
  cashInReal: number
  cashOutReal: number
  netCashFlowReal: number
  cashInProjected: number
  cashOutProjected: number
  netCashFlowProjected: number
  monthlyTrend: Array<{
    month: string
    inflow: number
    outflow: number
    net: number
  }>
  monthlyTrendProjected: Array<{
    month: string
    inflow: number
    outflow: number
    net: number
  }>
}

export interface BalanceSheetReport {
  asOf: string
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
}

export interface ReportsData {
  incomeStatement: IncomeStatementReport
  cashFlow: CashFlowReport
  balanceSheet: BalanceSheetReport
}

function numFromJson(v: unknown): number {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const n = Number(String(v))
  return Number.isNaN(n) ? 0 : n
}

function getCurrentMonthDateRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start, end }
}

export async function getReportsData(): Promise<ActionResult<ReportsData>> {
  try {
    const companyId = await getCurrentUserCompany()
    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()
    const { start, end } = getCurrentMonthDateRange()
    const now = new Date()
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const trendStartStr = trendStart.toISOString().split('T')[0]

    const [
      plRes,
      cashRes,
      balRes,
      trendResult,
    ] = await Promise.all([
      supabase.rpc('rpc_reports_income_statement_period', {
        p_company_id: companyId,
        p_from: startStr,
        p_to: endStr,
      }),
      supabase.rpc('rpc_reports_cash_flow_real_monthly', {
        p_company_id: companyId,
        p_from: trendStartStr,
        p_to: endStr,
      }),
      supabase.rpc('rpc_reports_balance_sheet', {
        p_company_id: companyId,
        p_as_of: endStr,
      }),
      supabase
        .from('transactions')
        .select('type, amount, status, date')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .gte('date', trendStartStr)
        .lte('date', endStr),
    ])

    if (plRes.error) {
      return { success: false, error: plRes.error.message }
    }
    if (cashRes.error) {
      return { success: false, error: cashRes.error.message }
    }
    if (balRes.error) {
      return { success: false, error: balRes.error.message }
    }
    if (trendResult.error) {
      return { success: false, error: trendResult.error.message }
    }

    const pl = (plRes.data ?? {}) as Record<string, unknown>
    const totalIncome = numFromJson(pl.totalIncome)
    const totalExpenses = numFromJson(pl.totalExpenses)
    const netProfit = totalIncome - totalExpenses
    const marginPercent = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    const ebRaw = pl.expenseBreakdown as unknown[] | undefined
    const expenseBreakdown = (ebRaw ?? []).map((item) => {
      const row = item as Record<string, unknown>
      return {
        category: String(row.category ?? ''),
        amount: numFromJson(row.amount),
      }
    })

    const bal = (balRes.data ?? {}) as Record<string, unknown>
    const balanceSheet: BalanceSheetReport = {
      asOf: String(bal.asOf ?? endStr),
      totalAssets: numFromJson(bal.totalAssets),
      totalLiabilities: numFromJson(bal.totalLiabilities),
      totalEquity: numFromJson(bal.totalEquity),
    }

    const trendRows = (trendResult.data ?? []) as Array<Record<string, unknown>>

    const monthMapReal = new Map<string, { inflow: number; outflow: number }>()
    const monthMapProjected = new Map<string, { inflow: number; outflow: number }>()
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMapReal.set(key, { inflow: 0, outflow: 0 })
      monthMapProjected.set(key, { inflow: 0, outflow: 0 })
    }

    const cashRows = (cashRes.data ?? []) as Array<Record<string, unknown>>
    for (const row of cashRows) {
      const mk = String(row.month ?? '')
      const slot = monthMapReal.get(mk)
      if (slot) {
        slot.inflow = numFromJson(row.inflow)
        slot.outflow = numFromJson(row.outflow)
      }
    }

    for (const row of trendRows) {
      const date = row.date as string
      const type = row.type as string
      const status = row.status as string
      const amount = Number(row.amount ?? 0)
      if (!date) continue
      const monthKey = date.slice(0, 7)
      const currentProjected = monthMapProjected.get(monthKey)
      if (!currentProjected) continue

      const isIncome = type === 'income'
      const isExpense = type === 'expense'
      if (!isIncome && !isExpense) continue

      if (status === 'posted' || status === 'approved' || status === 'pending') {
        if (isIncome) currentProjected.inflow += amount
        if (isExpense) currentProjected.outflow += amount
      }
    }

    const monthlyTrend = Array.from(monthMapReal.entries()).map(([month, values]) => ({
      month,
      inflow: values.inflow,
      outflow: values.outflow,
      net: values.inflow - values.outflow,
    }))
    const monthlyTrendProjected = Array.from(monthMapProjected.entries()).map(([month, values]) => ({
      month,
      inflow: values.inflow,
      outflow: values.outflow,
      net: values.inflow - values.outflow,
    }))

    const currentMonthTrendReal = monthlyTrend[monthlyTrend.length - 1] ?? {
      month: '',
      inflow: 0,
      outflow: 0,
      net: 0,
    }
    const currentMonthTrendProjected = monthlyTrendProjected[monthlyTrendProjected.length - 1] ?? {
      month: '',
      inflow: 0,
      outflow: 0,
      net: 0,
    }

    return {
      success: true,
      data: {
        incomeStatement: {
          periodLabel: start.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
          totalIncome,
          totalExpenses,
          netProfit,
          marginPercent,
          expenseBreakdown,
        },
        cashFlow: {
          periodLabel: start.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
          cashInReal: currentMonthTrendReal.inflow,
          cashOutReal: currentMonthTrendReal.outflow,
          netCashFlowReal: currentMonthTrendReal.net,
          cashInProjected: currentMonthTrendProjected.inflow,
          cashOutProjected: currentMonthTrendProjected.outflow,
          netCashFlowProjected: currentMonthTrendProjected.net,
          monthlyTrend,
          monthlyTrendProjected,
        },
        balanceSheet,
      },
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error desconocido' }
  }
}
