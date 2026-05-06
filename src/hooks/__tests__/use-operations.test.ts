import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useOperations } from '../use-operations'
import { useOperationStore } from '@/stores/operation-store'

vi.mock('@/lib/actions/operations', () => ({
  listOperations: vi.fn().mockResolvedValue({
    success: true,
    data: {
      operations: [
        {
          id: '1',
          type: 'income',
          amount: 100,
          description: 'Test operation',
          status: 'draft',
        },
      ],
      total: 1,
    },
  }),
}))

describe('useOperations hook', () => {
  beforeEach(() => {
    useOperationStore.setState({
      operations: [],
      filters: { page: 1, pageSize: 50 },
      pagination: { page: 1, pageSize: 50, total: 0 },
      isLoading: false,
      error: null,
    })
  })

  it('should return initial state', async () => {
    const { result } = renderHook(() => useOperations())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.operations.length).toBeGreaterThan(0)
    expect(result.current.error).toBeNull()
  })

  it('should apply filters when provided', async () => {
    renderHook(() => useOperations({ status: ['draft'] }))

    await waitFor(() => {
      expect(useOperationStore.getState().filters.status).toEqual(['draft'])
    })
  })

  it('should have refetch function', () => {
    const { result } = renderHook(() => useOperations())

    expect(typeof result.current.refetch).toBe('function')
  })
})
