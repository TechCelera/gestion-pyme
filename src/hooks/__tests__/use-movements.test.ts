import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMovements } from '../use-movements'
import { useMovementStore } from '@/stores/movement-store'

vi.mock('@/lib/actions/movements', () => ({
  listMovements: vi.fn().mockResolvedValue({
    success: true,
    data: {
      movements: [
        {
          id: '1',
          type: 'income',
          amount: 100,
          description: 'Test movement',
          status: 'draft',
        },
      ],
      total: 1,
    },
  }),
}))

describe('useMovements hook', () => {
  beforeEach(() => {
    useMovementStore.setState({
      movements: [],
      filters: { page: 1, pageSize: 50 },
      pagination: { page: 1, pageSize: 50, total: 0 },
      isLoading: false,
      error: null,
    })
  })

  it('should return initial state', async () => {
    const { result } = renderHook(() => useMovements())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.movements.length).toBeGreaterThan(0)
    expect(result.current.error).toBeNull()
  })

  it('should apply filters when provided', async () => {
    renderHook(() => useMovements({ status: ['draft'] }))

    await waitFor(() => {
      expect(useMovementStore.getState().filters.status).toEqual(['draft'])
    })
  })

  it('should have refetch function', () => {
    const { result } = renderHook(() => useMovements())

    expect(typeof result.current.refetch).toBe('function')
  })
})
