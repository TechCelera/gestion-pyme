import { describe, it, expect } from 'vitest'
import { getPasswordChecks, isPasswordStrong } from '../password-strength'

describe('password strength', () => {
  it('acepta contraseña con letra y número', () => {
    expect(isPasswordStrong('MiClave12')).toBe(true)
  })

  it('rechaza solo números', () => {
    expect(isPasswordStrong('12345678')).toBe(false)
  })

  it('rechaza corta', () => {
    expect(getPasswordChecks('Ab1').find((c) => c.id === 'length')?.met).toBe(false)
  })
})
