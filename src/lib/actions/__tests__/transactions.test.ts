import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getTransactions,
  getReportsData,
  updateTransactionStatus,
} from '../transactions'
import { evaluateBudgetStatus } from '@/lib/utils/budget'

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

describe('getReportsData server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should aggregate income statement and cash flow correctly', async () => {
    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const usersQuery = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { company_id: 'company-123' }, error: null }),
      }),
    }

    const periodRows = [
      { type: 'income', amount: 1000, categories: null },
      { type: 'income', amount: 500, categories: null },
      { type: 'expense', amount: 300, categories: { name: 'Operativos' } },
      { type: 'expense', amount: 100, categories: { name: 'Marketing' } },
      { type: 'expense', amount: 200, categories: { name: 'Operativos' } },
    ]

    const trendRows = [
      { type: 'income', amount: 1000, date: '2026-01-10' },
      { type: 'expense', amount: 300, date: '2026-01-20' },
      { type: 'income', amount: 500, date: '2026-06-03' },
      { type: 'expense', amount: 150, date: '2026-06-07' },
    ]

    const txQueryFirst = {
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: periodRows, error: null }),
    }
    const txQuerySecond = {
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: trendRows, error: null }),
    }

    let txSelectCall = 0
    const mockFrom = vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue(usersQuery),
        }
      }
      if (table === 'transactions') {
        txSelectCall += 1
        return {
          select: vi
            .fn()
            .mockReturnValue(txSelectCall === 1 ? txQueryFirst : txQuerySecond),
        }
      }
      return { select: vi.fn() }
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await getReportsData()

    expect(result.success).toBe(true)
    if (result.success && result.data) {
      expect(result.data.incomeStatement.totalIncome).toBe(1500)
      expect(result.data.incomeStatement.totalExpenses).toBe(600)
      expect(result.data.incomeStatement.netProfit).toBe(900)
      expect(result.data.incomeStatement.expenseBreakdown[0]).toEqual({
        category: 'Operativos',
        amount: 500,
      })

      expect(result.data.cashFlow.monthlyTrend.length).toBe(6)
      const lastMonth = result.data.cashFlow.monthlyTrend[result.data.cashFlow.monthlyTrend.length - 1]
      expect(lastMonth.net).toBe(lastMonth.inflow - lastMonth.outflow)
    }
  })

  it('should return error when transactions query fails', async () => {
    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const usersQuery = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { company_id: 'company-123' }, error: null }),
      }),
    }

    const failedQuery = {
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB exploded' } }),
    }
    const okQuery = {
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    let txSelectCall = 0
    const mockFrom = vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue(usersQuery),
        }
      }
      if (table === 'transactions') {
        txSelectCall += 1
        return {
          select: vi.fn().mockReturnValue(txSelectCall === 1 ? failedQuery : okQuery),
        }
      }
      return { select: vi.fn() }
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await getReportsData()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('DB exploded')
    }
  })
})

describe('budget flow rules', () => {
  it('should require budget approval when expense exceeds budget', () => {
    const result = evaluateBudgetStatus({
      budgetAmount: 1000,
      spentAmount: 900,
      newExpenseAmount: 200,
      endDate: null,
      operationDate: new Date('2026-05-02'),
    })

    expect(result.requiresBudgetApproval).toBe(true)
    expect(result.overBudgetBy).toBe(100)
  })

  it('should require budget approval when operation is out of term', () => {
    const result = evaluateBudgetStatus({
      budgetAmount: 5000,
      spentAmount: 100,
      newExpenseAmount: 100,
      endDate: '2026-04-30',
      operationDate: new Date('2026-05-02'),
    })

    expect(result.requiresBudgetApproval).toBe(true)
    expect(result.outOfTerm).toBe(true)
  })

  it('should block posting when budget approval is missing', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { requires_budget_approval: true, budget_approved_by: null },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    const mockRpc = vi.fn()

    vi.mocked(createClient).mockResolvedValue({
      from: mockFrom,
      rpc: mockRpc,
      auth: { getUser: vi.fn() },
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await updateTransactionStatus({ id: '11111111-1111-4111-8111-111111111111', status: 'posted' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('requiere aprobación adicional')
    }
    expect(mockRpc).not.toHaveBeenCalled()
  })
})