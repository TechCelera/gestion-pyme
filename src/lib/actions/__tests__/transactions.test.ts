import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTransactions } from '../transactions'

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Import the mocked module
import { createClient } from '@/lib/supabase/server'

describe('getTransactions server action', () => {
  let mockRpc: ReturnType<typeof vi.fn>
  let mockAuthGetUser: ReturnType<typeof vi.fn>
  let mockFrom: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockAuthGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockRpc = vi.fn()
    mockFrom = vi.fn()

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { company_id: 'company-123' } }),
      }),
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    const mockSupabase = {
      auth: {
        getUser: mockAuthGetUser,
      },
      from: mockFrom,
      rpc: mockRpc,
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)
  })

  it('should call RPC with raw search term (RPC handles escaping internally)', async () => {
    // Mock RPC response
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'tx-1',
          company_id: 'company-123',
          account_id: 'acc-1',
          account_name: 'Cuenta Corriente',
          category_id: 'cat-1',
          category_name: 'Ventas',
          type: 'income',
          status: 'posted',
          method: 'cash',
          amount: 1000,
          currency: 'USD',
          exchange_rate: 1,
          date: '2026-04-20',
          description: 'Test transaction',
          created_at: '2026-04-20T00:00:00Z',
          created_by: 'user-123',
          creator_name: 'Test User',
          total_count: 1,
        },
      ],
      error: null,
    })

    const result = await getTransactions({
      page: 1,
      pageSize: 50,
      search: '100%_complete',
    })

    // Verify RPC was called — search is passed raw; the RPC function handles ILIKE escaping
    expect(mockRpc).toHaveBeenCalledWith('get_transactions', expect.objectContaining({
      p_search: '100%_complete', // Raw — RPC's REPLACE() handles escaping
    }))

    // Verify success
    expect(result.success).toBe(true)
    if (result.success && result.data) {
      expect(result.data.total).toBe(1)
    }
  })

  it('should return auth error when user is not authenticated', async () => {
    // Mock auth failure
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    // Mock no company found
    const mockSelectNoCompany = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null }),
      }),
    })
    mockFrom.mockReturnValue({ select: mockSelectNoCompany })

    const result = await getTransactions({
      page: 1,
      pageSize: 50,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('autenticado')
    }
  })

  it('should map RPC result to Transaction type correctly', async () => {
    const rpcRow = {
      id: 'tx-456',
      company_id: 'company-123',
      account_id: 'acc-1',
      account_name: 'Caja',
      category_id: 'cat-2',
      category_name: 'Servicios',
      type: 'expense',
      status: 'draft',
      method: 'transfer',
      amount: 5000,
      currency: 'COP',
      exchange_rate: 1,
      date: '2026-04-22',
      description: 'Pago de servicios',
      contact_id: null,
      contact_type: null,
      contact_name: null,
      source_account_id: null,
      source_account_name: null,
      destination_account_id: null,
      destination_account_name: null,
      adjustment_reason: null,
      document_type: null,
      document_number: null,
      attachment_url: null,
      created_at: '2026-04-22T10:00:00Z',
      created_by: 'user-123',
      creator_name: 'Juan Pérez',
      updated_at: null,
      approved_by: null,
      approved_at: null,
      posted_by: null,
      posted_at: null,
      rejected_by: null,
      rejected_at: null,
      rejection_reason: null,
      total_count: 1,
    }

    mockRpc.mockResolvedValue({
      data: [rpcRow],
      error: null,
    })

    const result = await getTransactions({
      page: 1,
      pageSize: 50,
    })

    expect(result.success).toBe(true)
    if (result.success && result.data) {
      const tx = result.data.transactions[0]
      expect(tx.id).toBe('tx-456')
      expect(tx.accountId).toBe('acc-1')
      expect(tx.accountName).toBe('Caja')
      expect(tx.categoryId).toBe('cat-2')
      expect(tx.categoryName).toBe('Servicios')
      expect(tx.type).toBe('expense')
      expect(tx.status).toBe('draft')
      expect(tx.method).toBe('transfer')
      expect(tx.amount).toBe(5000)
      expect(tx.currency).toBe('COP')
      expect(tx.creatorName).toBe('Juan Pérez')
      expect(result.data.total).toBe(1)
    }
  })

  it('should return empty results when RPC returns empty data', async () => {
    mockRpc.mockResolvedValue({
      data: [],
      error: null,
    })

    const result = await getTransactions({
      page: 1,
      pageSize: 50,
    })

    expect(result.success).toBe(true)
    if (result.success && result.data) {
      expect(result.data.transactions).toEqual([])
      expect(result.data.total).toBe(0)
    }
  })

  it('should return error when RPC fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Function get_transactions not found' },
    })

    const result = await getTransactions({
      page: 1,
      pageSize: 50,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('base de datos')
    }
  })
})