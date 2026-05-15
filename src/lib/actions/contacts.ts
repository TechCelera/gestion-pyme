'use server'

import { createClient } from '@/lib/supabase/server'

export interface ContactRow {
  id: string
  name: string
  kind: 'client' | 'provider' | 'both'
  clientSegment: string | null
  associatedServices: string | null
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

export async function createContact(input: {
  name: string
  kind: ContactRow['kind']
  clientSegment?: string | null
  associatedServices?: string | null
}): Promise<ActionResult<ContactRow>> {
  try {
    const name = input.name.trim()
    if (!name) {
      return { success: false, error: 'El nombre es obligatorio' }
    }

    const companyId = await getCurrentUserCompany()
    if (!companyId) {
      return { success: false, error: 'Usuario no autenticado o sin empresa' }
    }

    const supabase = await createClient()
    const payload: Record<string, unknown> = {
      company_id: companyId,
      name,
      kind: input.kind,
      client_segment: input.clientSegment?.trim() || null,
      associated_services: input.associatedServices?.trim() || null,
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert(payload)
      .select('id, name, kind, client_segment, associated_services')
      .single()

    if (error || !data) {
      return { success: false, error: error?.message ?? 'No se pudo crear el contacto' }
    }

    const row = data as Record<string, unknown>
    return {
      success: true,
      data: {
        id: row.id as string,
        name: row.name as string,
        kind: row.kind as ContactRow['kind'],
        clientSegment: (row.client_segment as string | null) ?? null,
        associatedServices: (row.associated_services as string | null) ?? null,
      },
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
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
      .select('id, name, kind, client_segment, associated_services')
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
      clientSegment: (r.client_segment as string | null) ?? null,
      associatedServices: (r.associated_services as string | null) ?? null,
    }))

    return { success: true, data: rows }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}
