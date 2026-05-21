'use server'

import type { ActionResult } from '@/lib/actions/types'
import { requireAuthenticatedContext } from '@/lib/auth/server-context'
import { createClient } from '@/lib/supabase/server'
import {
  createContactSchema,
  normalizeContactEmail,
  updateContactSchema,
  type ContactKind,
  type CreateContactInput,
} from '@/lib/validations/contact'
import { isPostgresUniqueViolation } from '@/lib/utils/errors'

export type ContactRow = {
  id: string
  name: string
  kind: 'client' | 'provider' | 'both'
  phone: string | null
  email: string | null
  taxId: string | null
  notes: string | null
  clientSegment: string | null
  associatedServices: string | null
}

const CONTACT_SELECT =
  'id, name, kind, phone, email, tax_id, notes, client_segment, associated_services'

function mapContactRow(row: Record<string, unknown>): ContactRow {
  return {
    id: row.id as string,
    name: row.name as string,
    kind: row.kind as ContactRow['kind'],
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    taxId: (row.tax_id as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    clientSegment: (row.client_segment as string | null) ?? null,
    associatedServices: (row.associated_services as string | null) ?? null,
  }
}

async function findDuplicateContactName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  name: string,
  kind: ContactKind,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('contacts')
    .select('id')
    .eq('company_id', companyId)
    .eq('kind', kind)
    .is('deleted_at', null)
    .ilike('name', name.trim())

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query.limit(1)
  if (error) return false
  return (data?.length ?? 0) > 0
}

export async function createContact(
  input: CreateContactInput
): Promise<ActionResult<ContactRow>> {
  try {
    const parsed = createContactSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? 'Datos inválidos'
      return { success: false, error: first }
    }

    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth
    const data = parsed.data

    const supabase = await createClient()

    const duplicate = await findDuplicateContactName(
      supabase,
      companyId,
      data.name,
      data.kind
    )
    if (duplicate) {
      const label = data.kind === 'client' ? 'cliente' : 'proveedor'
      return {
        success: false,
        error: `Ya existe un ${label} con ese nombre`,
      }
    }

    const payload: Record<string, unknown> = {
      company_id: companyId,
      name: data.name.trim(),
      kind: data.kind,
      phone: data.phone.trim(),
      email: normalizeContactEmail(data.email ?? ''),
      client_segment: data.clientSegment?.trim() || null,
      associated_services: data.associatedServices?.trim() || null,
      tax_id: data.taxId?.trim() || null,
      notes: data.notes?.trim() || null,
    }

    const { data: row, error } = await supabase
      .from('contacts')
      .insert(payload)
      .select(CONTACT_SELECT)
      .single()

    if (error || !row) {
      if (isPostgresUniqueViolation(error)) {
        const label = data.kind === 'client' ? 'cliente' : 'proveedor'
        return { success: false, error: `Ya existe un ${label} con ese nombre` }
      }
      return { success: false, error: error?.message ?? 'No se pudo crear el contacto' }
    }

    return { success: true, data: mapContactRow(row as Record<string, unknown>) }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function updateContact(
  id: string,
  input: Partial<CreateContactInput>
): Promise<ActionResult<ContactRow>> {
  try {
    const parsed = updateContactSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? 'Datos inválidos'
      return { success: false, error: first }
    }

    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth
    const data = parsed.data

    const supabase = await createClient()

    const { data: existing, error: fetchError } = await supabase
      .from('contacts')
      .select('id, kind, name')
      .eq('id', id)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .maybeSingle()

    if (fetchError || !existing) {
      return { success: false, error: 'Contacto no encontrado' }
    }

    const nextName = data.name?.trim() ?? (existing.name as string)
    const nextKind = (data.kind ?? existing.kind) as ContactKind

    if (data.name !== undefined || data.kind !== undefined) {
      const duplicate = await findDuplicateContactName(
        supabase,
        companyId,
        nextName,
        nextKind,
        id
      )
      if (duplicate) {
        const label = nextKind === 'client' ? 'cliente' : 'proveedor'
        return { success: false, error: `Ya existe un ${label} con ese nombre` }
      }
    }

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.name !== undefined) payload.name = data.name.trim()
    if (data.kind !== undefined) payload.kind = data.kind
    if (data.phone !== undefined) payload.phone = data.phone.trim()
    if (data.email !== undefined) payload.email = normalizeContactEmail(data.email)
    if (data.clientSegment !== undefined) {
      payload.client_segment = data.clientSegment?.trim() || null
    }
    if (data.associatedServices !== undefined) {
      payload.associated_services = data.associatedServices?.trim() || null
    }
    if (data.taxId !== undefined) payload.tax_id = data.taxId?.trim() || null
    if (data.notes !== undefined) payload.notes = data.notes?.trim() || null

    const { data: row, error } = await supabase
      .from('contacts')
      .update(payload)
      .eq('id', id)
      .eq('company_id', companyId)
      .select(CONTACT_SELECT)
      .single()

    if (error || !row) {
      if (isPostgresUniqueViolation(error)) {
        const label = nextKind === 'client' ? 'cliente' : 'proveedor'
        return { success: false, error: `Ya existe un ${label} con ese nombre` }
      }
      return { success: false, error: error?.message ?? 'No se pudo actualizar' }
    }

    return { success: true, data: mapContactRow(row as Record<string, unknown>) }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function deleteContact(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId, userId } = auth

    const supabase = await createClient()
    const { error } = await supabase
      .from('contacts')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function getContacts(): Promise<ActionResult<ContactRow[]>> {
  try {
    const auth = await requireAuthenticatedContext()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    const { companyId } = auth

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('contacts')
      .select(CONTACT_SELECT)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name')

    if (error) {
      return { success: false, error: error.message }
    }

    const rows = (data ?? []).map((r) => mapContactRow(r as Record<string, unknown>))
    return { success: true, data: rows }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}
