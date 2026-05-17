'use server'

import { normalizeRole, USER_ROLES } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: string
  companyId: string
  companyName: string
  isActive: boolean
}

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function getProfile(): Promise<ActionResult<UserProfile>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const { data: row, error: queryError } = await supabase
      .from('users')
      .select('id, email, full_name, role, company_id, is_active')
      .eq('id', user.id)
      .single()

    if (queryError || !row) {
      return { success: false, error: queryError?.message ?? 'No se encontró el perfil' }
    }

    let companyName = ''
    if (row.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', row.company_id)
        .maybeSingle()
      companyName = company?.name ?? ''
    }

    return {
      success: true,
      data: {
        id: row.id,
        email: row.email ?? user.email ?? '',
        fullName: row.full_name ?? '',
        role: normalizeRole(row.role) ?? USER_ROLES.ADMIN,
        companyId: row.company_id,
        companyName,
        isActive: row.is_active ?? true,
      },
    }
  } catch (error) {
    console.error('getProfile error:', error)
    return { success: false, error: 'Error al cargar el perfil' }
  }
}

export async function updateProfile(fullName: string): Promise<ActionResult> {
  const trimmed = fullName.trim()
  if (!trimmed) {
    return { success: false, error: 'El nombre es obligatorio' }
  }

  if (trimmed.length > 100) {
    return { success: false, error: 'El nombre no puede superar 100 caracteres' }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ full_name: trimmed })
      .eq('id', user.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    const { error: metaError } = await supabase.auth.updateUser({
      data: { full_name: trimmed },
    })

    if (metaError) {
      return { success: false, error: metaError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('updateProfile error:', error)
    return { success: false, error: 'Error al actualizar el perfil' }
  }
}

export async function deactivateAccount(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', user.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      return { success: false, error: signOutError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('deactivateAccount error:', error)
    return { success: false, error: 'Error al desactivar la cuenta' }
  }
}
