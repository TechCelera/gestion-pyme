import { beforeEach, describe, expect, it, vi } from 'vitest'
import { USER_ROLES } from '@/lib/auth/roles'
import { mockCompaniesTable } from '@/test-utils/supabase-company-mocks'

const TEST_AUTH = {
  userId: 'user-1',
  companyId: 'company-1',
  role: USER_ROLES.ADMIN,
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/auth/server-context', () => ({
  requireAuthenticatedContext: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { requireAuthenticatedContext } from '@/lib/auth/server-context'
import { createAccount } from '@/lib/actions/accounts'

describe('accounts operating currency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuthenticatedContext).mockResolvedValue(TEST_AUTH)
  })

  it('createAccount persiste moneda del país aunque el cliente envíe otra', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'acc-1',
            name: 'Extra',
            type: 'bank',
            currency: 'ARS',
            balance: 0,
          },
          error: null,
        }),
      }),
    })

    const mockFrom = vi.fn((table: string) => {
      if (table === 'companies') return mockCompaniesTable('AR')
      if (table === 'accounts') {
        return { insert, select: vi.fn() }
      }
      return { select: vi.fn() }
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: TEST_AUTH.userId } }, error: null }),
      },
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await createAccount({
      name: 'Extra',
      type: 'bank',
      currency: 'USD',
      balance: 0,
    })

    expect(result.success).toBe(true)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'ARS',
      })
    )
  })
})
