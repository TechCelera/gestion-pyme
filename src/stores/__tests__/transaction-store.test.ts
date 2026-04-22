import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTransactionStore } from '../transaction-store'

// Mock the server actions
vi.mock('@/lib/actions/transactions', () => ({
  getTransactions: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  updateTransactionStatus: vi.fn(),
  deleteTransaction: vi.fn(),
}))

describe('Transaction Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useTransactionStore.setState({
      transactions: [],
      filters: { page: 1, pageSize: 50 },
      pagination: { page: 1, pageSize: 50, total: 0 },
      isLoading: false,
      error: null,
    })
  })

  describe('initial state', () => {
    it('should have empty transactions array', () => {
      const state = useTransactionStore.getState()
      expect(state.transactions).toEqual([])
    })

    it('should have default filters', () => {
      const state = useTransactionStore.getState()
      expect(state.filters).toEqual({ page: 1, pageSize: 50 })
    })

    it('should not be loading initially', () => {
      const state = useTransactionStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('should have no error initially', () => {
      const state = useTransactionStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('setFilters', () => {
    it('should update filters', () => {
      const { setFilters } = useTransactionStore.getState()
      setFilters({ status: ['draft'] })
      
      const state = useTransactionStore.getState()
      expect(state.filters.status).toEqual(['draft'])
    })

    it('should reset page to 1 when filters change', () => {
      useTransactionStore.setState({ filters: { page: 5, pageSize: 50 } })
      
      const { setFilters } = useTransactionStore.getState()
      setFilters({ status: ['pending'] })
      
      const state = useTransactionStore.getState()
      expect(state.filters.page).toBe(1)
    })
  })

  describe('setPagination', () => {
    it('should update pagination', () => {
      const { setPagination } = useTransactionStore.getState()
      setPagination({ page: 2 })
      
      const state = useTransactionStore.getState()
      expect(state.pagination.page).toBe(2)
    })

    it('should preserve other pagination values', () => {
      useTransactionStore.setState({ 
        pagination: { page: 1, pageSize: 50, total: 100 } 
      })
      
      const { setPagination } = useTransactionStore.getState()
      setPagination({ page: 3 })
      
      const state = useTransactionStore.getState()
      expect(state.pagination.pageSize).toBe(50)
      expect(state.pagination.total).toBe(100)
    })
  })

  describe('resetFilters', () => {
    it('should reset filters to defaults', () => {
      useTransactionStore.setState({
        filters: { status: ['draft'], type: ['income'], page: 3, pageSize: 25 },
      })
      
      const { resetFilters } = useTransactionStore.getState()
      resetFilters()
      
      const state = useTransactionStore.getState()
      expect(state.filters).toEqual({ page: 1, pageSize: 50 })
    })

    it('should preserve total count', () => {
      useTransactionStore.setState({
        pagination: { page: 5, pageSize: 25, total: 150 },
      })
      
      const { resetFilters } = useTransactionStore.getState()
      resetFilters()
      
      const state = useTransactionStore.getState()
      expect(state.pagination.total).toBe(150)
    })
  })
})
