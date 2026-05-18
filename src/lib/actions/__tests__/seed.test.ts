import { beforeEach, describe, expect, it, vi } from 'vitest'
import { stubAuthError, stubAuthenticatedContext } from '@/test-utils/mock-server-context'
import { COUNTRY_CONFIGS } from '@/lib/country-config'
import { USER_ROLES } from '@/lib/auth/roles'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { seedCompanyDefaults } from '../seed'

const COMPANY_ID = '11111111-1111-4111-8111-111111111111'

function buildSeedClient({
  country = 'AR',
  existingAccounts = [] as { name: string }[],
  existingCategories = [] as { name: string }[],
}: {
  country?: string
  existingAccounts?: { name: string }[]
  existingCategories?: { name: string }[]
} = {}) {
  const insertedAccounts: unknown[] = []
  const insertedCategories: unknown[] = []

  const mockAuthGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'user-1', app_metadata: { company_id: COMPANY_ID } } },
    error: null,
  })

  const mockFrom = vi.fn((table: string) => {
    if (table === 'companies') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { country }, error: null }),
          }),
        }),
      }
    }

    if (table === 'accounts') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ data: existingAccounts, error: null }),
          }),
        }),
        insert: vi.fn((rows: unknown) => {
          insertedAccounts.push(...(Array.isArray(rows) ? rows : [rows]))
          return Promise.resolve({ error: null })
        }),
      }
    }

    if (table === 'categories') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ data: existingCategories, error: null }),
          }),
        }),
        insert: vi.fn((rows: unknown) => {
          insertedCategories.push(...(Array.isArray(rows) ? rows : [rows]))
          return Promise.resolve({ error: null })
        }),
      }
    }

    return { select: vi.fn() }
  })

  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  } as unknown as Awaited<ReturnType<typeof createClient>>)

  stubAuthenticatedContext({
    userId: 'user-1',
    companyId: COMPANY_ID,
    role: USER_ROLES.ADMIN,
  })

  return { insertedAccounts, insertedCategories }
}

describe('seedCompanyDefaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('falla sin empresa del usuario', async () => {
    stubAuthError('Usuario no autenticado o sin empresa')

    const res = await seedCompanyDefaults()
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/no autenticado/i)
  })

  it('inserta cuentas y categorías mínimas cuando la empresa está vacía', async () => {
    const { insertedAccounts, insertedCategories } = buildSeedClient()

    const res = await seedCompanyDefaults()
    const config = COUNTRY_CONFIGS.AR

    expect(res.success).toBe(true)
    expect(res.data?.accountsCreated).toBe(config.accounts.length)
    expect(res.data?.categoriesCreated).toBe(config.categories.length)
    expect(insertedAccounts).toHaveLength(config.accounts.length)
    expect(insertedCategories).toHaveLength(config.categories.length)
    expect(insertedAccounts[0]).toMatchObject({
      company_id: COMPANY_ID,
      name: 'Caja',
      type: 'cash',
      currency: 'ARS',
      balance: 0,
    })
  })

  it('no duplica cuentas ni categorías que ya existen por nombre', async () => {
    buildSeedClient({
      existingAccounts: [{ name: 'Caja' }],
      existingCategories: [{ name: 'Ventas de Productos' }],
    })

    const res = await seedCompanyDefaults()
    const config = COUNTRY_CONFIGS.AR

    expect(res.success).toBe(true)
    expect(res.data?.accountsCreated).toBe(config.accounts.length - 1)
    expect(res.data?.categoriesCreated).toBe(config.categories.length - 1)
  })
})
