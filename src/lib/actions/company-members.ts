'use server'

import { randomBytes } from 'crypto'
import type { ActionResult } from '@/lib/actions/types'
import { requireAdminContext } from '@/lib/auth/server-context'
import { createClient } from '@/lib/supabase/server'
import { normalizeRole, USER_ROLES, type CanonicalUserRole } from '@/lib/auth/roles'
import { MAX_USERS_PER_COMPANY } from '@/lib/constants'
import { errorMessageForUser } from '@/lib/utils/errors'

export interface CompanyMember {
  id: string
  email: string
  fullName: string
  role: CanonicalUserRole
  isActive: boolean
  createdAt: string
}

export interface CompanyInvitePreview {
  email: string
  fullName: string
  companyName: string
  expired: boolean
}

export async function listCompanyMembers(): Promise<ActionResult<CompanyMember[]>> {
  try {
    const ctx = await requireAdminContext()
    if (!ctx.ok) return { success: false, error: ctx.error }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at')
      .eq('company_id', ctx.companyId)
      .order('created_at', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const members: CompanyMember[] = (data ?? []).map((row) => ({
      id: row.id,
      email: row.email ?? '',
      fullName: row.full_name ?? '',
      role: normalizeRole(row.role) ?? USER_ROLES.COLLABORATOR,
      isActive: row.is_active ?? true,
      createdAt: row.created_at,
    }))

    return { success: true, data: members }
  } catch (e) {
    return { success: false, error: errorMessageForUser(e, 'Error al cargar el equipo') }
  }
}

export async function updateCompanyMember(
  memberId: string,
  input: { role?: CanonicalUserRole; isActive?: boolean }
): Promise<ActionResult> {
  try {
    const ctx = await requireAdminContext()
    if (!ctx.ok) return { success: false, error: ctx.error }

    if (memberId === ctx.userId) {
      return { success: false, error: 'No podés cambiar tu propio rol o estado desde aquí' }
    }

    const supabase = await createClient()
    const { data: target, error: fetchError } = await supabase
      .from('users')
      .select('id, company_id, role, is_active')
      .eq('id', memberId)
      .eq('company_id', ctx.companyId)
      .maybeSingle()

    if (fetchError || !target) {
      return { success: false, error: 'Usuario no encontrado en tu empresa' }
    }

    const payload: Record<string, unknown> = {}
    if (input.role !== undefined) payload.role = input.role
    if (input.isActive !== undefined) payload.is_active = input.isActive

    if (Object.keys(payload).length === 0) {
      return { success: false, error: 'Nada que actualizar' }
    }

    if (input.role === USER_ROLES.COLLABORATOR && normalizeRole(target.role) === USER_ROLES.ADMIN) {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', ctx.companyId)
        .eq('role', USER_ROLES.ADMIN)
        .eq('is_active', true)

      if ((count ?? 0) <= 1) {
        return { success: false, error: 'Debe quedar al menos un administrador activo' }
      }
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(payload)
      .eq('id', memberId)
      .eq('company_id', ctx.companyId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (e) {
    return { success: false, error: errorMessageForUser(e, 'Error al actualizar el usuario') }
  }
}

export async function createCompanyInvite(
  email: string,
  fullName: string
): Promise<ActionResult<{ inviteUrl: string }>> {
  try {
    const ctx = await requireAdminContext()
    if (!ctx.ok) return { success: false, error: ctx.error }

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = fullName.trim()

    if (!trimmedEmail || !trimmedName) {
      return { success: false, error: 'Correo y nombre son obligatorios' }
    }

    const supabase = await createClient()

    const { count: memberCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', ctx.companyId)
      .eq('is_active', true)

    const { count: pendingCount } = await supabase
      .from('company_invites')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', ctx.companyId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())

    if ((memberCount ?? 0) + (pendingCount ?? 0) >= MAX_USERS_PER_COMPANY) {
      return {
        success: false,
        error: `Máximo ${MAX_USERS_PER_COMPANY} usuarios por empresa (incluye invitaciones pendientes)`,
      }
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('company_id', ctx.companyId)
      .ilike('email', trimmedEmail)
      .maybeSingle()

    if (existingUser) {
      return { success: false, error: 'Ese correo ya pertenece a tu empresa' }
    }

    const token = randomBytes(24).toString('hex')
    const { error: insertError } = await supabase.from('company_invites').insert({
      company_id: ctx.companyId,
      email: trimmedEmail,
      full_name: trimmedName,
      role: USER_ROLES.COLLABORATOR,
      token,
      invited_by: ctx.userId,
    })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
      process.env.VERCEL_URL?.replace(/^(?!https?:\/\/)/, 'https://') ??
      'http://localhost:3000'

    const origin = base.startsWith('http') ? base : `https://${base}`

    return {
      success: true,
      data: { inviteUrl: `${origin}/register?invite=${token}` },
    }
  } catch (e) {
    return { success: false, error: errorMessageForUser(e, 'Error al crear la invitación') }
  }
}

export async function getCompanyInvitePreview(
  token: string
): Promise<ActionResult<CompanyInvitePreview>> {
  try {
    const trimmed = token.trim()
    if (!trimmed) {
      return { success: false, error: 'Invitación inválida' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_company_invite_by_token', {
      p_token: trimmed,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      return { success: false, error: 'Invitación no encontrada' }
    }

    const r = row as Record<string, unknown>
    return {
      success: true,
      data: {
        email: String(r.email ?? ''),
        fullName: String(r.full_name ?? ''),
        companyName: String(r.company_name ?? ''),
        expired: Boolean(r.expired),
      },
    }
  } catch (e) {
    return { success: false, error: errorMessageForUser(e, 'Error al validar la invitación') }
  }
}
