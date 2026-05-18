import { isPasswordStrong } from '@/lib/auth/password-strength'

/** Longitud mínima alineada con Supabase y flujos de cambio de contraseña. */
export const MIN_AUTH_PASSWORD_LENGTH = 8

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < MIN_AUTH_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_AUTH_PASSWORD_LENGTH} caracteres`
  }
  if (!isPasswordStrong(password)) {
    return 'Usá al menos una letra y un número en la contraseña'
  }
  return null
}

export function validateAuthPasswords(
  password: string,
  confirmPassword: string
): string | null {
  const strengthError = validatePasswordStrength(password)
  if (strengthError) return strengthError
  if (password !== confirmPassword) {
    return 'Las contraseñas no coinciden'
  }
  return null
}

export function validateTermsAccepted(accepted: boolean): string | null {
  if (!accepted) {
    return 'Aceptá los términos y la política de privacidad para continuar'
  }
  return null
}

/** Evita filtrar detalles de Auth en login (enumeración / timing). */
export function mapSignInErrorMessage(error: { message?: string } | null): string {
  const msg = error?.message?.toLowerCase() ?? ''
  if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
    return 'Confirmá tu correo antes de ingresar. Revisá tu bandeja de entrada.'
  }
  if (
    msg.includes('invalid login') ||
    msg.includes('invalid credentials') ||
    msg.includes('invalid email or password')
  ) {
    return 'Correo o contraseña incorrectos.'
  }
  return 'No pudimos iniciar sesión. Intentá de nuevo.'
}

/** Mensajes genéricos en registro (no revelar si el correo ya existe). */
export function mapSignUpErrorMessage(error: { message?: string } | null): string {
  const msg = error?.message?.toLowerCase() ?? ''
  if (msg.includes('password')) {
    return 'La contraseña no cumple los requisitos de seguridad.'
  }
  if (msg.includes('email') && msg.includes('invalid')) {
    return 'Ingresá un correo válido.'
  }
  return 'No pudimos crear la cuenta. Revisá los datos e intentá de nuevo.'
}

/** Mensajes claros en recuperación (rate limit, redirect URL) sin filtrar si el correo existe. */
export function mapPasswordResetErrorMessage(error: { message?: string } | null): string {
  const msg = error?.message?.toLowerCase() ?? ''
  if (
    msg.includes('rate limit') ||
    msg.includes('email rate') ||
    (msg.includes('after') && msg.includes('second'))
  ) {
    return 'Enviaste varios correos seguidos. Espera unos minutos e intenta de nuevo.'
  }
  if (msg.includes('redirect') && msg.includes('not allowed')) {
    return 'No pudimos preparar el enlace de recuperación. Contacta al administrador.'
  }
  return 'No se pudo enviar el correo. Espera unos minutos e intenta de nuevo.'
}

/** Supabase puede devolver usuario sin identities si el correo ya está registrado. */
export function isSignUpDuplicateEmail(
  user: { identities?: readonly unknown[] | null } | null
): boolean {
  return Boolean(user?.identities && user.identities.length === 0)
}
