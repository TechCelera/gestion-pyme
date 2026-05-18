/** Rutas de auth accesibles sin sesión. */
export const PUBLIC_AUTH_PREFIXES = [
  '/login',
  '/register',
  '/terminos',
  '/privacidad',
  '/recuperar-contrasena',
  '/nueva-contrasena',
  '/auth',
  '/_next',
  '/api/auth',
] as const

const STATIC_ASSET_PATHS = new Set([
  '/favicon.ico',
  '/icon.svg',
  '/manifest.json',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
])

const STATIC_ASSET_EXTENSION = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|webmanifest)$/i

/** Metadata routes generadas por Next (icon, apple-icon, manifest). */
function isNextMetadataRoute(pathname: string): boolean {
  return (
    pathname === '/icon' ||
    pathname.startsWith('/icon?') ||
    pathname === '/apple-icon' ||
    pathname.startsWith('/apple-icon?')
  )
}

/** Archivos estáticos y metadata PWA: nunca pasar por redirect de login. */
export function shouldBypassEdgeAuth(pathname: string): boolean {
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/icons/')) return true
  if (STATIC_ASSET_PATHS.has(pathname)) return true
  if (STATIC_ASSET_EXTENSION.test(pathname)) return true
  if (isNextMetadataRoute(pathname)) return true
  return false
}

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PREFIXES.some((route) => pathname.startsWith(route))
}
