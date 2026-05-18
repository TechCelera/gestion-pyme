'use server'

import { ROUTES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { mapSignInErrorMessage, normalizeAuthEmail } from '@/lib/validations/auth'

export type AuthActionSuccess = { success: true; redirectTo: string }
export type AuthActionFailure = { success: false; error: string }
export type AuthActionResult = AuthActionSuccess | AuthActionFailure

/** Inicia sesión en el servidor; las cookies quedan alineadas con middleware/RSC. */
export async function signInAction(email: string, password: string): Promise<AuthActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizeAuthEmail(email),
    password,
  })

  if (error) {
    return { success: false, error: mapSignInErrorMessage(error) }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      success: false,
      error: 'No pudimos establecer la sesión. Intenta de nuevo.',
    }
  }

  return { success: true, redirectTo: ROUTES.DASHBOARD }
}

/** Tras recuperación de contraseña (sesión ya en cookies). */
export async function updatePasswordAction(password: string): Promise<AuthActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return {
      success: false,
      error: 'No se pudo actualizar la contraseña. Intenta de nuevo.',
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      success: false,
      error: 'No pudimos confirmar la sesión. Intenta de nuevo.',
    }
  }

  return { success: true, redirectTo: ROUTES.DASHBOARD }
}
