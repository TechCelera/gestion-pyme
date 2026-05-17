'use server'

import { createClient } from '@/lib/supabase/server'
import type { ChartAccountWithBalance } from '@/lib/chart-of-accounts-balances'

export interface ChartAccountRow {
  id: string
  parentId: string | null
  code: string
  name: string
  accountType: string
  isPostable: boolean
  sortOrder: number
}

export interface ChartOfAccountsSnapshot {
  asOf: string
  currency: string
  rows: ChartAccountWithBalance[]
}

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

async function getCurrentUserCompany(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) return null
    const appMeta = user.app_metadata as Record<string, unknown>
    if (appMeta?.company_id) return appMeta.company_id as string
    if (user.user_metadata?.company_id) return user.user_metadata.company_id as string
    const { data } = await supabase.from('users').select('company_id').eq('id', user.id).single()
    return data?.company_id ?? null
  } catch {
    return null
  }
}

export async function listChartOfAccounts(): Promise<ActionResult<ChartAccountRow[]>> {
  const snapshot = await listChartOfAccountsWithBalances()
  if (!snapshot.success || !snapshot.data) {
    return { success: snapshot.success, error: snapshot.error }
  }
  return {
    success: true,
    data: snapshot.data.rows.map(
      ({ id, parentId, code, name, accountType, isPostable, sortOrder }) => ({
        id,
        parentId,
        code,
        name,
        accountType,
        isPostable,
        sortOrder,
      })
    ),
  }
}

export async function listChartOfAccountsWithBalances(
  asOf?: string
): Promise<ActionResult<ChartOfAccountsSnapshot>> {
  try {
    const companyId = await getCurrentUserCompany()
    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const asOfDate = asOf ?? new Date().toISOString().slice(0, 10)
    const supabase = await createClient()

    const [{ data: chartRows, error: chartError }, { data: company }, { data: balancesJson, error: rpcError }] =
      await Promise.all([
        supabase
          .from('chart_of_accounts')
          .select('id, parent_id, code, name, account_type, is_postable, sort_order')
          .eq('company_id', companyId)
          .order('sort_order', { ascending: true })
          .order('code', { ascending: true }),
        supabase.from('companies').select('currency').eq('id', companyId).single(),
        supabase.rpc('rpc_chart_of_accounts_balances', {
          p_company_id: companyId,
          p_as_of: asOfDate,
        }),
      ])

    if (chartError) {
      return { success: false, error: chartError.message }
    }
    if (rpcError) {
      return { success: false, error: rpcError.message }
    }

    const balanceById = new Map<string, number>()
    if (Array.isArray(balancesJson)) {
      for (const item of balancesJson) {
        const row = item as { id?: string; balance?: number }
        if (row.id) balanceById.set(row.id, Number(row.balance ?? 0))
      }
    }

    const rows: ChartAccountWithBalance[] = (chartRows ?? []).map((r) => ({
      id: r.id as string,
      parentId: (r.parent_id as string | null) ?? null,
      code: r.code as string,
      name: r.name as string,
      accountType: r.account_type as string,
      isPostable: Boolean(r.is_postable),
      sortOrder: Number(r.sort_order ?? 0),
      balance: balanceById.get(r.id as string) ?? 0,
    }))

    return {
      success: true,
      data: {
        asOf: asOfDate,
        currency: (company?.currency as string) ?? 'ARS',
        rows,
      },
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Error al cargar plan de cuentas',
    }
  }
}
