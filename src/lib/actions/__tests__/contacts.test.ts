import { describe, it, expect, vi, beforeEach } from 'vitest'
import { stubAuthenticatedContext } from '@/test-utils/mock-server-context'
import { USER_ROLES } from '@/lib/auth/roles'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { createContact, getContacts, updateContact } from '../contacts'

describe('getContacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubAuthenticatedContext({
      userId: 'u1',
      companyId: 'c1',
      role: USER_ROLES.ADMIN,
    })
  })

  it('devuelve contactos ordenados por nombre', async () => {
    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'u1', app_metadata: { company_id: 'c1' } } },
      error: null,
    })

    const mockOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'p1',
          name: 'Ana',
          kind: 'client',
          phone: '11',
          email: null,
          tax_id: null,
          notes: null,
          client_segment: null,
          associated_services: null,
        },
        {
          id: 'p2',
          name: 'Beto',
          kind: 'provider',
          phone: '22',
          email: 'b@x.com',
          tax_id: null,
          notes: null,
          client_segment: null,
          associated_services: null,
        },
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
      expect(res.data[0].clientSegment).toBeNull()
      expect(res.data[0].associatedServices).toBeNull()
    }
  })
})

describe('createContact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubAuthenticatedContext({
      userId: 'u1',
      companyId: 'c1',
      role: USER_ROLES.ADMIN,
    })
  })

  it('rechaza duplicado por nombre y tipo', async () => {
    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    })

    const mockLimit = vi.fn().mockResolvedValue({
      data: [{ id: 'existing' }],
      error: null,
    })
    const mockIlike = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockIs = vi.fn().mockReturnValue({ ilike: mockIlike })
    const mockEqKind = vi.fn().mockReturnValue({ is: mockIs })
    const mockEqCompany = vi.fn().mockReturnValue({ eq: mockEqKind })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqCompany })

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: vi.fn(() => ({ select: mockSelect })),
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await createContact({
      name: 'Ana',
      kind: 'client',
      phone: '11 9999-0000',
      email: '',
    })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/ya existe/i)
    }
  })

})

describe('updateContact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubAuthenticatedContext({
      userId: 'u1',
      companyId: 'c1',
      role: USER_ROLES.ADMIN,
    })
  })

  it('actualiza teléfono y correo', async () => {
    const updatedRow = {
      id: 'c1',
      name: 'Ana',
      kind: 'client',
      phone: '11 9999-8888',
      email: 'ana@test.com',
      tax_id: null,
      notes: null,
      client_segment: null,
      associated_services: null,
    }

    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'c1', name: 'Ana', kind: 'client' },
      error: null,
    })
    const mockSingle = vi.fn().mockResolvedValue({ data: updatedRow, error: null })

    const mockFromUpdate = {
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: mockSingle }),
        }),
      }),
    }

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue(mockFromUpdate),
      })),
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await updateContact('c1', {
      phone: '11 9999-8888',
      email: 'ana@test.com',
    })
    expect(res.success).toBe(true)
    if (res.success && res.data) {
      expect(res.data.phone).toBe('11 9999-8888')
      expect(res.data.email).toBe('ana@test.com')
    }
  })
})
