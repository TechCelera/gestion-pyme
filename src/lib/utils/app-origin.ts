/** Canonical app origin for invite links, password recovery redirects, etc. */
export function getAppOrigin(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    (process.env.VERCEL_URL
      ? process.env.VERCEL_URL.replace(/^(?!https?:\/\/)/, 'https://')
      : 'http://localhost:3000')

  return base.startsWith('http') ? base : `https://${base}`
}
