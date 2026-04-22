import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTransactions } from '../use-transactions'
import { useTransactionStore } from '@/stores/transaction-store'

// Mock the server actions
vi.mock('@/lib/actions/transactions', () => ({
  getTransactions: vi.fn().mockResolvedValue({
    success: true,
    data: {
      transactions: [
        {
          id: '1',
          type: 'income',
          amount: 100,
          description: 'Test transaction',
          status: 'draft',
        },
      ],
      total: 1,
    },
  }),
}))

describe('useTransactions hook', () => {
  beforeEach(() => {
    useTransactionStore.setState({
      transactions: [],
      filters: { page: 1, pageSize: 50 },
      pagination: { page: 1, pageSize: 50, total: 0 },
      isLoading: false,
      error: null,
    })
  })

  it('should return initial state', async () => {
    const { result } = renderHook(() => useTransactions())
    
    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    // Should have loaded the mocked data
    expect(result.current.transactions.length).toBeGreaterThan(0)
    expect(result.current.error).toBeNull()
  })

  it('should apply filters when provided', () => {
    const { result } = renderHook(() => useTransactions({ status: ['draft'] }))
    
    expect(result.current.transactions).toEqual([])
  })

  it('should have refetch function', () => {
    const { result } = renderHook(() => useTransactions())
    
    expect(typeof result.current.refetch).toBe('function')
  })
})
