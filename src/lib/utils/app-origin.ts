/** Canonical app origin for invite links, password recovery redirects, etc. */
export function getAppOrigin(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    (process.env.VERCEL_URL
      ? process.env.VERCEL_URL.replace(/^(?!https?:\/\/)/, 'https://')
      : 'http://localhost:3000')

  return base.startsWith('http') ? base : `https://${base}`
}

/** Origen en el navegador (redirects de registro / recuperación). */
export function getClientAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return getAppOrigin()
}

/** Callback Supabase (intercambia PKCE) con ruta final tras establecer sesión. */
export function buildAuthCallbackRedirect(nextPath: string, origin?: string): string {
  const base = (origin ?? getAppOrigin()).replace(/\/$/, '')
  const normalizedNext = nextPath.startsWith('/') ? nextPath : `/${nextPath}`
  return `${base}/auth/callback?next=${encodeURIComponent(normalizedNext)}`
}
