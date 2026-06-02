import { describe, it, expect } from 'vitest'
import {
  mapGoogleOAuthStartError,
  mapOAuthCallbackError,
  mapPasswordResetErrorMessage,
  mapSignInErrorMessage,
  mapSignUpErrorMessage,
  normalizeAuthEmail,
  validateAuthPasswords,
  validateTermsAccepted,
} from '../auth'

describe('normalizeAuthEmail', () => {
  it('recorta y pasa a minúsculas', () => {
    expect(normalizeAuthEmail('  Juan@Mail.COM ')).toBe('juan@mail.com')
  })
})

describe('validateAuthPasswords', () => {
  it('rechaza contraseña corta', () => {
    expect(validateAuthPasswords('Ab1', 'Ab1')).toMatch(/al menos 8/)
  })

  it('rechaza sin letra o número', () => {
    expect(validateAuthPasswords('12345678', '12345678')).toMatch(/letra y un número/)
  })

  it('rechaza si no coinciden', () => {
    expect(validateAuthPasswords('MiClave12', '87654321')).toBe('Las contraseñas no coinciden')
  })

  it('acepta contraseñas válidas', () => {
    expect(validateAuthPasswords('MiClave12', 'MiClave12')).toBeNull()
  })
})

describe('validateTermsAccepted', () => {
  it('exige aceptación', () => {
    expect(validateTermsAccepted(false)).toMatch(/términos/)
  })
})

describe('mapSignInErrorMessage', () => {
  it('pide confirmar email sin exponer credenciales', () => {
    expect(mapSignInErrorMessage({ message: 'Email not confirmed' })).toMatch(/Confirmá tu correo/)
  })

  it('mensaje genérico en credenciales inválidas', () => {
    expect(mapSignInErrorMessage({ message: 'Invalid login credentials' })).toBe(
      'Correo o contraseña incorrectos.'
    )
  })
})

describe('mapSignUpErrorMessage', () => {
  it('no filtra mensaje crudo de usuario existente', () => {
    expect(mapSignUpErrorMessage({ message: 'User already registered' })).toMatch(
      /No pudimos crear/
    )
  })
})

describe('mapOAuthCallbackError', () => {
  it('mensaje claro si el usuario cancela en Google', () => {
    expect(mapOAuthCallbackError('access_denied', null)).toMatch(/Cancelaste/)
  })

  it('mensaje genérico en fallo de callback', () => {
    expect(mapOAuthCallbackError('auth_callback', null)).toMatch(/correo y contraseña/)
  })
})

describe('mapGoogleOAuthStartError', () => {
  it('avisa si el proveedor no está habilitado', () => {
    expect(mapGoogleOAuthStartError('Provider google is not enabled')).toMatch(/habilitado/)
  })
})

describe('mapPasswordResetErrorMessage', () => {
  it('avisa rate limit sin revelar si el correo existe', () => {
    expect(mapPasswordResetErrorMessage({ message: 'email rate limit exceeded' })).toMatch(
      /Espera unos minutos/
    )
  })

  it('avisa redirect URL no permitida', () => {
    expect(
      mapPasswordResetErrorMessage({ message: 'redirect_to URL is not allowed' })
    ).toMatch(/administrador/)
  })
})
