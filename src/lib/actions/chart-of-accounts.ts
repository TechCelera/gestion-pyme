'use server'

import { createClient } from '@/lib/supabase/server'

export interface ChartAccountRow {
  id: string
  parentId: string | null
  code: string
  name: string
  accountType: string
  isPostable: boolean
  sortOrder: number
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
  try {
    const companyId = await getCurrentUserCompany()
    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('id, parent_id, code, name, account_type, is_postable, sort_order')
      .eq('company_id', companyId)
      .order('sort_order', { ascending: true })
      .order('code', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const rows = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      parentId: (r.parent_id as string | null) ?? null,
      code: r.code as string,
      name: r.name as string,
      accountType: r.account_type as string,
      isPostable: Boolean(r.is_postable),
      sortOrder: Number(r.sort_order ?? 0),
    }))

    return { success: true, data: rows }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error al cargar plan de cuentas' }
  }
}
