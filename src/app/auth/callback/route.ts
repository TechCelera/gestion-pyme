import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  authCompletionSurfaceFromPath,
  extractEventualNextFromReturnPath,
} from '@/lib/auth/auth-completion-routes'
import { resolvePostAuthPath } from '@/lib/auth/profile-completion'
import { userNeedsProfileCompletion } from '@/lib/auth/server-profile-completion'
import { ROUTES } from '@/lib/constants'

/** Intercambia el código PKCE del enlace de confirmación / magic link. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawReturnPath = searchParams.get('next') ?? ROUTES.DASHBOARD
  const returnPathname = rawReturnPath.split('?')[0] ?? ROUTES.LOGIN
  const surface = authCompletionSurfaceFromPath(returnPathname)
  const eventualNext = extractEventualNextFromReturnPath(rawReturnPath)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const needsCompletion = user
        ? await userNeedsProfileCompletion(supabase, user)
        : false
      const destination = resolvePostAuthPath(needsCompletion, eventualNext, surface)
      return NextResponse.redirect(new URL(destination, origin))
    }
  }

  if (rawReturnPath === ROUTES.RESET_PASSWORD || eventualNext === ROUTES.RESET_PASSWORD) {
    return NextResponse.redirect(new URL(ROUTES.FORGOT_PASSWORD, origin))
  }

  const loginUrl = new URL(ROUTES.LOGIN, origin)
  loginUrl.searchParams.set('error', 'auth_callback')
  return NextResponse.redirect(loginUrl)
}
