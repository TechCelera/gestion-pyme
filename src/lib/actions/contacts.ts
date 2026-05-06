'use server'

import { createClient } from '@/lib/supabase/server'

export interface ContactRow {
  id: string
  name: string
  kind: 'client' | 'provider' | 'both'
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

    if (error || !user) {
      return null
    }

    const appMeta = user.app_metadata as Record<string, unknown>
    if (appMeta?.company_id) {
      return appMeta.company_id as string
    }

    if (user.user_metadata?.company_id) {
      return user.user_metadata.company_id as string
    }

    const { data, error: queryError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (queryError) {
      return null
    }

    return data?.company_id ?? null
  } catch {
    return null
  }
}

export async function getContacts(): Promise<ActionResult<ContactRow[]>> {
  try {
    const companyId = await getCurrentUserCompany()
    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, kind')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name')

    if (error) {
      return { success: false, error: error.message }
    }

    const rows = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      kind: r.kind as ContactRow['kind'],
    }))

    return { success: true, data: rows }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}
