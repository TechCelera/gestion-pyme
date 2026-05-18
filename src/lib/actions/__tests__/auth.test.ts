import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockSignIn = vi.fn()
const mockUpdateUser = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mockSignIn,
      updateUser: mockUpdateUser,
      getUser: mockGetUser,
    },
  })),
}))

describe('signInAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve error mapeado si credenciales inválidas', async () => {
    mockSignIn.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })

    const { signInAction } = await import('../auth')
    const result = await signInAction('user@test.com', 'wrong')

    expect(result).toEqual({
      success: false,
      error: 'Correo o contraseña incorrectos.',
    })
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it('devuelve redirectTo si la sesión queda establecida', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

    const { signInAction } = await import('../auth')
    const result = await signInAction('user@test.com', 'ValidPass1')

    expect(result).toEqual({ success: true, redirectTo: '/dashboard' })
  })

  it('falla si no hay usuario tras signIn', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const { signInAction } = await import('../auth')
    const result = await signInAction('user@test.com', 'ValidPass1')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/sesión/)
    }
  })
})
