import { useEffect } from 'react'
import { useTransactionStore } from '@/stores/transaction-store'
import type { TransactionFilters } from '@/lib/validations/transaction'

export function useTransactions(filters?: Partial<TransactionFilters>) {
  const {
    transactions,
    pagination,
    isLoading,
    error,
    setFilters,
    setPagination,
    fetchTransactions,
  } = useTransactionStore()

  // Aplicar filtros iniciales si se proporcionan
  useEffect(() => {
    if (filters) {
      setFilters(filters)
    }
  }, [])

  // Cargar transacciones cuando cambien filtros o paginación
  useEffect(() => {
    fetchTransactions()
  }, [pagination.page, pagination.pageSize])

  return {
    transactions,
    pagination,
    isLoading,
    error,
    setFilters,
    setPagination,
    refetch: fetchTransactions,
  }
}
