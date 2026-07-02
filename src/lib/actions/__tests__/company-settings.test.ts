import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockRequireAuth = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/auth/server-context', () => ({
  requireAuthenticatedContext: () => mockRequireAuth(),
}))

describe('company-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue({
      userId: 'u1',
      companyId: 'c1',
      role: 'admin_finanzas',
    })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  })

  it('getCompanySettings deriva moneda del país', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'companies') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'c1',
                  name: 'Acme',
                  country: 'CO',
                  currency: 'ARS',
                  operating_profile: 'distribuidora',
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'transactions') {
        return {
          select: () => ({
            eq: () => ({
              is: () =>
                Promise.resolve({
                  count: 0,
                  error: null,
                }),
            }),
          }),
        }
      }
      return {}
    })

    const { getCompanySettings } = await import('@/lib/actions/company-settings')
    const res = await getCompanySettings()
    expect(res.success).toBe(true)
    expect(res.data?.country).toBe('CO')
    expect(res.data?.currency).toBe('COP')
    expect(res.data?.operatingProfile).toBe('distribuidora')
    expect(res.data?.canChangeCountry).toBe(true)
  })

  it('updateCompanyCountry rechaza si hay movimientos', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'transactions') {
        return {
          select: () => ({
            eq: () => ({
              is: () => Promise.resolve({ count: 3, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const { updateCompanyCountry } = await import('@/lib/actions/company-settings')
    const res = await updateCompanyCountry('AR')
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/movimientos/)
  })
})
