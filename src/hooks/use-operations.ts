import { useEffect } from 'react'
import { useOperationStore } from '@/stores/operation-store'
import type { OperationFilters } from '@/lib/validations/operation'

export function useOperations(filters?: Partial<OperationFilters>) {
  const {
    operations,
    pagination,
    isLoading,
    error,
    setFilters,
    setPagination,
    fetchOperations,
  } = useOperationStore()

  useEffect(() => {
    if (filters) {
      setFilters(filters)
    }
  }, [])

  useEffect(() => {
    void fetchOperations()
  }, [pagination.page, pagination.pageSize])

  return {
    operations,
    pagination,
    isLoading,
    error,
    setFilters,
    setPagination,
    refetch: fetchOperations,
  }
}
