import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getContacts } from '../contacts'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

describe('getContacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve contactos ordenados por nombre', async () => {
    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'u1', app_metadata: { company_id: 'c1' } } },
      error: null,
    })

    const mockOrder = vi.fn().mockResolvedValue({
      data: [
        { id: 'p1', name: 'Ana', kind: 'client' },
        { id: 'p2', name: 'Beto', kind: 'provider' },
      ],
      error: null,
    })
    const mockIs = vi.fn().mockReturnValue({ order: mockOrder })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

    const mockFrom = vi.fn((table: string) => {
      if (table === 'contacts') {
        return { select: mockSelect }
      }
      return { select: vi.fn() }
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await getContacts()
    expect(res.success).toBe(true)
    if (res.success && res.data) {
      expect(res.data).toHaveLength(2)
      expect(res.data[0].name).toBe('Ana')
    }
  })
})
