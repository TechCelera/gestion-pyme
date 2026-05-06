import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useOperationStore } from '../operation-store'

vi.mock('@/lib/actions/operations', () => ({
  listOperations: vi.fn(),
  createOperation: vi.fn(),
  updateOperation: vi.fn(),
  updateOperationStatus: vi.fn(),
  deleteOperation: vi.fn(),
}))

describe('operation store', () => {
  beforeEach(() => {
    useOperationStore.setState({
      operations: [],
      filters: { page: 1, pageSize: 50 },
      pagination: { page: 1, pageSize: 50, total: 0 },
      isLoading: false,
      error: null,
    })
  })

  describe('initial state', () => {
    it('should have empty operations array', () => {
      const state = useOperationStore.getState()
      expect(state.operations).toEqual([])
    })

    it('should have default filters', () => {
      const state = useOperationStore.getState()
      expect(state.filters).toEqual({ page: 1, pageSize: 50 })
    })

    it('should not be loading initially', () => {
      const state = useOperationStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('should have no error initially', () => {
      const state = useOperationStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('setFilters', () => {
    it('should update filters', () => {
      const { setFilters } = useOperationStore.getState()
      setFilters({ status: ['draft'] })

      const state = useOperationStore.getState()
      expect(state.filters.status).toEqual(['draft'])
    })

    it('should reset page to 1 when filters change', () => {
      useOperationStore.setState({ filters: { page: 5, pageSize: 50 } })

      const { setFilters } = useOperationStore.getState()
      setFilters({ status: ['pending'] })

      const state = useOperationStore.getState()
      expect(state.filters.page).toBe(1)
    })
  })

  describe('setPagination', () => {
    it('should update pagination', () => {
      const { setPagination } = useOperationStore.getState()
      setPagination({ page: 2 })

      const state = useOperationStore.getState()
      expect(state.pagination.page).toBe(2)
    })

    it('should preserve other pagination values', () => {
      useOperationStore.setState({
        pagination: { page: 1, pageSize: 50, total: 100 },
      })

      const { setPagination } = useOperationStore.getState()
      setPagination({ page: 3 })

      const state = useOperationStore.getState()
      expect(state.pagination.pageSize).toBe(50)
      expect(state.pagination.total).toBe(100)
    })
  })

  describe('resetFilters', () => {
    it('should reset filters to defaults', () => {
      useOperationStore.setState({
        filters: { status: ['draft'], type: ['income'], page: 3, pageSize: 25 },
      })

      const { resetFilters } = useOperationStore.getState()
      resetFilters()

      const state = useOperationStore.getState()
      expect(state.filters).toEqual({ page: 1, pageSize: 50 })
    })

    it('should preserve total count', () => {
      useOperationStore.setState({
        pagination: { page: 5, pageSize: 25, total: 150 },
      })

      const { resetFilters } = useOperationStore.getState()
      resetFilters()

      const state = useOperationStore.getState()
      expect(state.pagination.total).toBe(150)
    })
  })
})
