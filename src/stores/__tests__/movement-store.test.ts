import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMovementStore } from '../movement-store'
import { useAuthStore } from '../auth-store'

vi.mock('@/lib/actions/movements', () => ({
  listMovements: vi.fn(),
  createMovement: vi.fn(),
  updateMovement: vi.fn(),
  updateMovementStatus: vi.fn(),
  finalizeMovementSubmission: vi.fn(),
  deleteMovement: vi.fn(),
}))

vi.mock('../auth-store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ isDemoMode: false })),
  },
}))

describe('movement store', () => {
  beforeEach(() => {
    useMovementStore.setState({
      movements: [],
      demoMovements: null,
      filters: { page: 1, pageSize: 50 },
      pagination: { page: 1, pageSize: 50, total: 0 },
      isLoading: false,
      error: null,
    })
    vi.mocked(useAuthStore.getState).mockReturnValue({ isDemoMode: false } as ReturnType<
      typeof useAuthStore.getState
    >)
  })

  describe('initial state', () => {
    it('should have empty movements array', () => {
      const state = useMovementStore.getState()
      expect(state.movements).toEqual([])
    })

    it('should have default filters', () => {
      const state = useMovementStore.getState()
      expect(state.filters).toEqual({ page: 1, pageSize: 50 })
    })

    it('should not be loading initially', () => {
      const state = useMovementStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('should have no error initially', () => {
      const state = useMovementStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('setFilters', () => {
    it('should update filters', () => {
      const { setFilters } = useMovementStore.getState()
      setFilters({ status: ['draft'] })

      const state = useMovementStore.getState()
      expect(state.filters.status).toEqual(['draft'])
    })

    it('should reset page to 1 when filters change', () => {
      useMovementStore.setState({ filters: { page: 5, pageSize: 50 } })

      const { setFilters } = useMovementStore.getState()
      setFilters({ status: ['pending'] })

      const state = useMovementStore.getState()
      expect(state.filters.page).toBe(1)
    })
  })

  describe('setPagination', () => {
    it('should update pagination', () => {
      const { setPagination } = useMovementStore.getState()
      setPagination({ page: 2 })

      const state = useMovementStore.getState()
      expect(state.pagination.page).toBe(2)
    })

    it('should preserve other pagination values', () => {
      useMovementStore.setState({
        pagination: { page: 1, pageSize: 50, total: 100 },
      })

      const { setPagination } = useMovementStore.getState()
      setPagination({ page: 3 })

      const state = useMovementStore.getState()
      expect(state.pagination.pageSize).toBe(50)
      expect(state.pagination.total).toBe(100)
    })
  })

  describe('resetFilters', () => {
    it('should reset filters to defaults', () => {
      useMovementStore.setState({
        filters: { status: ['draft'], type: ['income'], page: 3, pageSize: 25 },
      })

      const { resetFilters } = useMovementStore.getState()
      resetFilters()

      const state = useMovementStore.getState()
      expect(state.filters).toEqual({ page: 1, pageSize: 50 })
    })

    it('should preserve total count', () => {
      useMovementStore.setState({
        pagination: { page: 5, pageSize: 25, total: 150 },
      })

      const { resetFilters } = useMovementStore.getState()
      resetFilters()

      const state = useMovementStore.getState()
      expect(state.pagination.total).toBe(150)
    })
  })

  describe('demo mode', () => {
    it('agrega movimiento a la lista en sesión demo', async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({ isDemoMode: true } as ReturnType<
        typeof useAuthStore.getState
      >)

      const ok = await useMovementStore.getState().addMovement(
        {
          type: 'income',
          date: new Date(),
          amount: 999,
          currency: 'ARS',
          description: 'Prueba demo',
          method: 'cash',
          accountId: 'demo-acc-1',
          categoryId: 'demo-cat-1',
          movementComponents: [
            {
              componentType: 'operative_cash',
              accountId: 'demo-acc-1',
              amount: 999,
              currency: 'ARS',
            },
          ],
        },
        false
      )

      expect(ok).toBe(true)
      const state = useMovementStore.getState()
      expect(state.movements.some((m) => m.amount === 999)).toBe(true)
      expect(state.demoMovements?.length).toBeGreaterThan(0)
    })
  })
})
