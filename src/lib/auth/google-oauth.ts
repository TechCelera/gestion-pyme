import type { AuthCompletionSurface } from '@/lib/auth/auth-completion-routes'
import { buildAuthCompletarReturnPath } from '@/lib/auth/auth-completion-routes'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { buildAuthCallbackRedirect, getClientAppOrigin } from '@/lib/utils/app-origin'
import { ROUTES } from '@/lib/constants'

export type GoogleOAuthMetadata = Record<string, string>

export type StartGoogleOAuthOptions = {
  /** Tras OAuth, vuelta a login o registro con formulario inline si la cuenta es nueva. */
  returnSurface?: AuthCompletionSurface
  /** Ruta final tras completar perfil (dashboard u otra interna). */
  nextPath?: string
  /** Metadata para usuarios nuevos (empresa, invitación, país). */
  metadata?: GoogleOAuthMetadata
}

export type StartGoogleOAuthResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Inicia OAuth con Google. Supabase redirige al navegador; no hay validación previa
 * de “tener cuenta Google” — eso lo resuelve la pantalla de Google (login/alta/cancelar).
 */
export async function startGoogleOAuth(
  options: StartGoogleOAuthOptions = {}
): Promise<StartGoogleOAuthResult> {
  const nextPath = options.nextPath ?? ROUTES.DASHBOARD
  const returnPath = buildAuthCompletarReturnPath(
    options.returnSurface ?? 'login',
    nextPath
  )
  const redirectTo = buildAuthCallbackRedirect(returnPath, getClientAppOrigin())
  const supabase = createSafeBrowserClient()

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account' },
      ...(options.metadata ? { data: options.metadata } : {}),
    },
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
