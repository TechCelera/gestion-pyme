import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMovementStore } from '../movement-store'
import {
  createMovement,
  finalizeMovementSubmission,
  listMovements,
} from '@/lib/actions/movements'
import type { Movement } from '@/lib/actions/movements'

vi.mock('@/lib/actions/movements', () => ({
  listMovements: vi.fn(),
  createMovement: vi.fn(),
  updateMovement: vi.fn(),
  updateMovementStatus: vi.fn(),
  finalizeMovementSubmission: vi.fn(),
  deleteMovement: vi.fn(),
}))

const draftMovement: Movement = {
  id: 'tx-11111111-1111-4111-8111-111111111111',
  accountId: 'acc-1',
  accountName: 'Banco',
  categoryId: null,
  categoryName: null,
  type: 'income',
  operationKind: 'collection',
  contactId: 'contact-1',
  status: 'draft',
  method: 'cash',
  amount: 1000,
  currency: 'ARS',
  date: '2026-05-20',
  description: 'Cobro: Cliente',
  createdAt: '2026-05-20T12:00:00Z',
  createdBy: 'user-1',
  creatorName: null,
}

const createInput = {
  type: 'income' as const,
  operationKind: 'collection' as const,
  movementScope: 'general' as const,
  date: new Date('2026-05-20'),
  amount: 1000,
  currency: 'ARS',
  description: 'Cobro: Cliente',
  method: 'cash' as const,
  accountId: 'acc-1',
  contactId: 'contact-1',
  contactType: 'cliente' as const,
}

describe('movement store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(listMovements).mockResolvedValue({
      success: true,
      data: { movements: [], total: 0 },
    })
    useMovementStore.setState({
      movements: [],
      filters: { page: 1, pageSize: 50 },
      pagination: { page: 1, pageSize: 50, total: 0 },
      isLoading: false,
      error: null,
    })
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

  describe('addMovement', () => {
    it('guarda borrador sin llamar finalizeMovementSubmission', async () => {
      vi.mocked(createMovement).mockResolvedValue({ success: true, data: draftMovement })

      const ok = await useMovementStore.getState().addMovement(createInput, true)

      expect(ok).toBe(true)
      expect(createMovement).toHaveBeenCalledTimes(1)
      expect(finalizeMovementSubmission).not.toHaveBeenCalled()
      expect(listMovements).toHaveBeenCalled()
    })

    it('envía a aprobación llamando finalizeMovementSubmission', async () => {
      vi.mocked(createMovement).mockResolvedValue({ success: true, data: draftMovement })
      vi.mocked(finalizeMovementSubmission).mockResolvedValue({
        success: true,
        data: { status: 'pending' },
      })

      const ok = await useMovementStore.getState().addMovement(createInput, false)

      expect(ok).toBe(true)
      expect(finalizeMovementSubmission).toHaveBeenCalledWith(draftMovement.id)
    })

    it('falla si create ok pero sin id al enviar a aprobación', async () => {
      vi.mocked(createMovement).mockResolvedValue({ success: true })

      const ok = await useMovementStore.getState().addMovement(createInput, false)

      expect(ok).toBe(false)
      expect(finalizeMovementSubmission).not.toHaveBeenCalled()
      expect(useMovementStore.getState().error).toMatch(/no se pudo enviar/i)
    })

    it('falla si finalizeMovementSubmission falla', async () => {
      vi.mocked(createMovement).mockResolvedValue({ success: true, data: draftMovement })
      vi.mocked(finalizeMovementSubmission).mockResolvedValue({
        success: false,
        error: 'COMPONENTS_SUM_MISMATCH_BEFORE_PENDING',
      })

      const ok = await useMovementStore.getState().addMovement(createInput, false)

      expect(ok).toBe(false)
      expect(useMovementStore.getState().error).toContain('COMPONENTS_SUM_MISMATCH')
    })
  })
})
