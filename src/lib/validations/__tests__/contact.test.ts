import { describe, expect, it } from 'vitest'
import { createContactSchema } from '@/lib/validations/contact'

describe('createContactSchema', () => {
  it('exige nombre y teléfono', () => {
    const res = createContactSchema.safeParse({
      name: '',
      kind: 'client',
      phone: '123',
    })
    expect(res.success).toBe(false)
  })

  it('acepta email vacío', () => {
    const res = createContactSchema.safeParse({
      name: 'Acme',
      kind: 'client',
      phone: '11 4444-5555',
      email: '',
    })
    expect(res.success).toBe(true)
  })

  it('rechaza email inválido', () => {
    const res = createContactSchema.safeParse({
      name: 'Acme',
      kind: 'provider',
      phone: '11 4444-5555',
      email: 'no-es-mail',
    })
    expect(res.success).toBe(false)
  })
})
