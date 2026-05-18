import { describe, it, expect } from 'vitest'
import { validateRegisterCompanyName, validateRegisterPasswords } from '../register'

describe('validateRegisterPasswords', () => {
  it('rechaza contraseña corta', () => {
    expect(validateRegisterPasswords('1234567', '1234567')).toMatch(/al menos 8/)
  })

  it('rechaza si no coinciden', () => {
    expect(validateRegisterPasswords('MiClave12', 'MiClave99')).toBe('Las contraseñas no coinciden')
  })

  it('acepta contraseñas válidas', () => {
    expect(validateRegisterPasswords('MiClave12', 'MiClave12')).toBeNull()
  })
})

describe('validateRegisterCompanyName', () => {
  it('exige nombre en registro normal', () => {
    expect(validateRegisterCompanyName('   ', false)).toMatch(/empresa/)
  })

  it('no exige nombre en modo invitación', () => {
    expect(validateRegisterCompanyName('', true)).toBeNull()
  })
})
