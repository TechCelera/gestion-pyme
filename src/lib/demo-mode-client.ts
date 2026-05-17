/** Client-side check for the demo_mode cookie (non-httpOnly). */
export function hasDemoModeCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((c) => c.trim() === 'demo_mode=true')
}
