import { useEffect, useRef } from 'react'
import { useMovementStore } from '@/stores/movement-store'
import type { MovementFilters } from '@/lib/validations/movement'

export function useMovements(filters?: Partial<MovementFilters>) {
  const {
    movements,
    pagination,
    isLoading,
    error,
    setFilters,
    setPagination,
    fetchMovements,
  } = useMovementStore()

  const appliedFiltersKey = useRef<string | null>(null)

  useEffect(() => {
    if (!filters) return
    const key = JSON.stringify(filters)
    if (appliedFiltersKey.current === key) return
    appliedFiltersKey.current = key
    setFilters(filters)
  }, [filters, setFilters])

  useEffect(() => {
    void fetchMovements()
  }, [pagination.page, pagination.pageSize, fetchMovements])

  return {
    movements,
    pagination,
    isLoading,
    error,
    setFilters,
    setPagination,
    refetch: fetchMovements,
  }
}
