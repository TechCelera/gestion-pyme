import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listCompanyMembers } from '../company-members'
import { resolveRouteSearchParam } from '@/lib/next/resolve-route-search-param'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

describe('resolveRouteSearchParam', () => {
  it('normaliza string y array', () => {
    expect(resolveRouteSearchParam('a')).toBe('a')
    expect(resolveRouteSearchParam(['b', 'c'])).toBe('b')
    expect(resolveRouteSearchParam(undefined)).toBeUndefined()
  })
})

describe('company-members', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rechaza listado si no es admin', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'u1' } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { company_id: 'c1', role: 'collaborator' },
                  error: null,
                }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await listCompanyMembers()
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('administrador')
    }
  })

})
