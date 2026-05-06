import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listOperations,
  getReportsData,
  updateOperationStatus,
  createOperation,
  updateOperation,
  getOperationComponents,
} from '../operations'
import { evaluateBudgetStatus } from '@/lib/utils/budget'

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Import the mocked module
import { createClient } from '@/lib/supabase/server'

describe('listOperations', () => {
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

    const result = await listOperations({
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

    const result = await listOperations({
      page: 1,
      pageSize: 50,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('autenticado')
    }
  })

  it('mapea fila RPC al tipo Operation', async () => {
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

    const result = await listOperations({
      page: 1,
      pageSize: 50,
    })

    expect(result.success).toBe(true)
    if (result.success && result.data) {
      const op = result.data.operations[0]
      expect(op.id).toBe('tx-456')
      expect(op.accountId).toBe('acc-1')
      expect(op.accountName).toBe('Caja')
      expect(op.categoryId).toBe('cat-2')
      expect(op.categoryName).toBe('Servicios')
      expect(op.type).toBe('expense')
      expect(op.status).toBe('draft')
      expect(op.method).toBe('transfer')
      expect(op.amount).toBe(5000)
      expect(op.currency).toBe('COP')
      expect(op.creatorName).toBe('Juan Pérez')
      expect(result.data.total).toBe(1)
    }
  })

  it('should return empty results when RPC returns empty data', async () => {
    mockRpc.mockResolvedValue({
      data: [],
      error: null,
    })

    const result = await listOperations({
      page: 1,
      pageSize: 50,
    })

    expect(result.success).toBe(true)
    if (result.success && result.data) {
      expect(result.data.operations).toEqual([])
      expect(result.data.total).toBe(0)
    }
  })

  it('should return error when RPC fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Function get_transactions not found' },
    })

    const result = await listOperations({
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

  it('combina RPC del diario con tendencia proyectada desde transacciones', async () => {
    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const usersQuery = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { company_id: 'company-123' }, error: null }),
      }),
    }

    const trendRows = [
      { type: 'income', amount: 1000, date: '2026-01-10' },
      { type: 'expense', amount: 300, date: '2026-01-20' },
      { type: 'income', amount: 500, date: '2026-06-03' },
      { type: 'expense', amount: 150, date: '2026-06-07' },
    ]

    const txQuery = {
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: trendRows, error: null }),
    }

    const mockFrom = vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue(usersQuery),
        }
      }
      if (table === 'transactions') {
        return {
          select: vi.fn().mockReturnValue(txQuery),
        }
      }
      return { select: vi.fn() }
    })

    const mockRpc = vi.fn((name: string) => {
      if (name === 'rpc_reports_income_statement_period') {
        return Promise.resolve({
          data: {
            totalIncome: 1500,
            totalExpenses: 600,
            expenseBreakdown: [
              { category: 'Operativos', amount: 500 },
              { category: 'Marketing', amount: 100 },
            ],
          },
          error: null,
        })
      }
      if (name === 'rpc_reports_cash_flow_real_monthly') {
        return Promise.resolve({
          data: [],
          error: null,
        })
      }
      if (name === 'rpc_reports_balance_sheet') {
        return Promise.resolve({
          data: {
            totalAssets: 12000,
            totalLiabilities: 5000,
            totalEquity: 7000,
            asOf: '2026-05-31',
          },
          error: null,
        })
      }
      return Promise.resolve({ data: null, error: null })
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
      rpc: mockRpc,
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

      expect(result.data.balanceSheet.totalAssets).toBe(12000)
      expect(result.data.balanceSheet.totalLiabilities).toBe(5000)
      expect(result.data.balanceSheet.totalEquity).toBe(7000)

      expect(result.data.cashFlow.monthlyTrend.length).toBe(6)
      const lastMonth = result.data.cashFlow.monthlyTrend[result.data.cashFlow.monthlyTrend.length - 1]
      expect(lastMonth.net).toBe(lastMonth.inflow - lastMonth.outflow)

      expect(mockRpc).toHaveBeenCalledWith(
        'rpc_reports_income_statement_period',
        expect.objectContaining({
          p_company_id: 'company-123',
        })
      )
    }
  })

  it('propaga error si falla la consulta de transacciones (proyectado)', async () => {
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

    const mockFrom = vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue(usersQuery),
        }
      }
      if (table === 'transactions') {
        return {
          select: vi.fn().mockReturnValue(failedQuery),
        }
      }
      return { select: vi.fn() }
    })

    const mockRpc = vi.fn((name: string) => {
      if (name === 'rpc_reports_income_statement_period') {
        return Promise.resolve({
          data: { totalIncome: 0, totalExpenses: 0, expenseBreakdown: [] },
          error: null,
        })
      }
      if (name === 'rpc_reports_cash_flow_real_monthly') {
        return Promise.resolve({ data: [], error: null })
      }
      if (name === 'rpc_reports_balance_sheet') {
        return Promise.resolve({
          data: { totalAssets: 0, totalLiabilities: 0, totalEquity: 0, asOf: '2026-05-31' },
          error: null,
        })
      }
      return Promise.resolve({ data: null, error: null })
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
      rpc: mockRpc,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await getReportsData()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('DB exploded')
    }
  })

  it('propaga error si falla el RPC de estado de resultados', async () => {
    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const usersQuery = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { company_id: 'company-123' }, error: null }),
      }),
    }

    const okTrend = {
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    const mockFrom = vi.fn((table: string) => {
      if (table === 'users') {
        return { select: vi.fn().mockReturnValue(usersQuery) }
      }
      if (table === 'transactions') {
        return { select: vi.fn().mockReturnValue(okTrend) }
      }
      return { select: vi.fn() }
    })

    const mockRpc = vi.fn((name: string) => {
      if (name === 'rpc_reports_income_statement_period') {
        return Promise.resolve({ data: null, error: { message: 'rpc caído' } })
      }
      if (name === 'rpc_reports_cash_flow_real_monthly') {
        return Promise.resolve({ data: [], error: null })
      }
      if (name === 'rpc_reports_balance_sheet') {
        return Promise.resolve({
          data: { totalAssets: 0, totalLiabilities: 0, totalEquity: 0, asOf: '2026-05-31' },
          error: null,
        })
      }
      return Promise.resolve({ data: null, error: null })
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
      rpc: mockRpc,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await getReportsData()
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('rpc caído')
    }
  })
})

describe('createOperation con operationComponents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('llama set_operation_components tras create_transaction', async () => {
    const companyId = 'company-123'
    const txId = '11111111-1111-4111-8111-111111111111'
    const accountId = '550e8400-e29b-41d4-a716-446655440001'
    const categoryId = '550e8400-e29b-41d4-a716-446655440002'
    const contactId = '550e8400-e29b-41d4-a716-446655440003'

    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123', app_metadata: { company_id: companyId } } },
      error: null,
    })

    const mockRpc = vi.fn((name: string) => {
      if (name === 'create_transaction') {
        return Promise.resolve({ data: txId, error: null })
      }
      if (name === 'set_operation_components') {
        return Promise.resolve({ data: null, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })

    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: txId,
        account_id: accountId,
        accounts: { name: 'Caja' },
        category_id: categoryId,
        categories: { name: 'Ventas' },
        type: 'income',
        status: 'draft',
        method: 'cash',
        amount: 150,
        currency: 'ARS',
        date: '2026-05-01',
        description: 'Mix',
        created_at: '2026-05-01T00:00:00Z',
        created_by: 'user-123',
        users: { full_name: 'Tester' },
        project_id: null,
        projects: null,
        fund_owner: 'company',
        requires_budget_approval: false,
      },
      error: null,
    })

    const mockFrom = vi.fn((table: string) => {
      if (table === 'transactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
      rpc: mockRpc,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await createOperation({
      type: 'income',
      date: new Date('2026-05-01'),
      amount: 150,
      currency: 'ARS',
      description: 'Mix de medios',
      method: 'cash',
      accountId,
      categoryId,
      operationComponents: [
        { componentType: 'operative_cash', accountId, amount: 100 },
        { componentType: 'client_receivable', contactId, amount: 50 },
      ],
    })

    expect(result.success).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith(
      'set_operation_components',
      expect.objectContaining({
        p_transaction_id: txId,
        p_components: expect.arrayContaining([
          expect.objectContaining({ component_type: 'operative_cash', amount: 100 }),
          expect.objectContaining({ component_type: 'client_receivable', amount: 50 }),
        ]),
      })
    )
  })
})

describe('updateOperation con operationComponents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('llama set_operation_components cuando hay desglose', async () => {
    const companyId = 'company-123'
    const txId = '22222222-2222-4222-8222-222222222222'
    const accountId = '550e8400-e29b-41d4-a716-446655440001'
    const categoryId = '550e8400-e29b-41d4-a716-446655440002'

    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123', app_metadata: { company_id: companyId } } },
      error: null,
    })

    const mockRpc = vi.fn((name: string) => {
      if (name === 'set_operation_components') {
        return Promise.resolve({ data: null, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })

    const rowAfterChain = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { type: 'income', account_id: accountId, amount: 200, currency: 'ARS' },
        error: null,
      }),
    }
    rowAfterChain.eq.mockReturnValue(rowAfterChain)

    const mockFrom = vi.fn((table: string) => {
      if (table === 'transactions') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
          select: vi.fn().mockReturnValue(rowAfterChain),
        }
      }
      return { select: vi.fn() }
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
      rpc: mockRpc,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await updateOperation(txId, {
      accountId,
      categoryId,
      type: 'income',
      amount: 200,
      date: new Date('2026-05-02'),
      description: 'Actualizado',
      method: 'cash',
      currency: 'ARS',
      operationComponents: [{ componentType: 'operative_bank', accountId, amount: 200 }],
    })

    expect(result.success).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith(
      'set_operation_components',
      expect.objectContaining({
        p_transaction_id: txId,
        p_components: [
          expect.objectContaining({
            component_type: 'operative_bank',
            account_id: accountId,
            amount: 200,
            currency: 'ARS',
          }),
        ],
      })
    )
  })
})

describe('getOperationComponents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mapea filas de operation_components', async () => {
    const companyId = 'company-123'
    const txId = '33333333-3333-4333-8333-333333333333'

    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123', app_metadata: { company_id: companyId } } },
      error: null,
    })

    const mockFrom = vi.fn((table: string) => {
      if (table === 'transactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: txId }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'operation_components') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'oc1',
                    component_type: 'operative_cash',
                    account_id: '550e8400-e29b-41d4-a716-446655440001',
                    contact_id: null,
                    amount: 40,
                    currency: 'ARS',
                  },
                ],
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await getOperationComponents(txId)
    expect(result.success).toBe(true)
    if (result.success && result.data) {
      expect(result.data).toHaveLength(1)
      expect(result.data[0].componentType).toBe('operative_cash')
      expect(result.data[0].amount).toBe(40)
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

    const result = await updateOperationStatus({ id: '11111111-1111-4111-8111-111111111111', status: 'posted' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('requiere aprobación adicional')
    }
    expect(mockRpc).not.toHaveBeenCalled()
  })
})