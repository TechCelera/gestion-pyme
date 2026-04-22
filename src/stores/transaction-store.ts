import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Transaction } from '@/lib/actions/transactions'
import type { 
  TransactionFilters, 
  CreateTransactionInput,
  TransactionStatus 
} from '@/lib/validations/transaction'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  updateTransactionStatus,
  deleteTransaction,
} from '@/lib/actions/transactions'

interface Pagination {
  page: number
  pageSize: number
  total: number
}

interface TransactionState {
  // State
  transactions: Transaction[]
  filters: TransactionFilters
  pagination: Pagination
  isLoading: boolean
  error: string | null
  
  // Actions
  setFilters: (filters: Partial<TransactionFilters>) => void
  setPagination: (pagination: Partial<Pagination>) => void
  resetFilters: () => void
  
  // Async Actions
  fetchTransactions: () => Promise<void>
  addTransaction: (data: CreateTransactionInput) => Promise<boolean>
  editTransaction: (id: string, data: CreateTransactionInput) => Promise<boolean>
  changeStatus: (id: string, status: TransactionStatus, reason?: string) => Promise<boolean>
  removeTransaction: (id: string) => Promise<boolean>
}

const defaultFilters: TransactionFilters = {
  page: 1,
  pageSize: 50,
}

const defaultPagination: Pagination = {
  page: 1,
  pageSize: 50,
  total: 0,
}

export const useTransactionStore = create<TransactionState>()(
  devtools(
    (set, get) => ({
      transactions: [],
      filters: defaultFilters,
      pagination: defaultPagination,
      isLoading: false,
      error: null,

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters, page: 1 }, // Reset page on filter change
        }))
      },

      setPagination: (pagination) => {
        set((state) => ({
          pagination: { ...state.pagination, ...pagination },
        }))
      },

      resetFilters: () => {
        set({
          filters: defaultFilters,
          pagination: { ...defaultPagination, total: get().pagination.total },
        })
      },

      fetchTransactions: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const { filters, pagination } = get()
          const result = await getTransactions({
            ...filters,
            page: pagination.page,
            pageSize: pagination.pageSize,
          })

          if (result.success && result.data) {
            set({
              transactions: result.data.transactions,
              pagination: {
                ...pagination,
                total: result.data.total,
              },
              isLoading: false,
            })
          } else {
            set({
              error: result.error ?? 'Error al cargar transacciones',
              isLoading: false,
            })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false,
          })
        }
      },

      addTransaction: async (data) => {
        set({ isLoading: true, error: null })
        
        try {
          const result = await createTransaction(data)

          if (result.success) {
            await get().fetchTransactions()
            set({ isLoading: false })
            return true
          } else {
            set({
              error: result.error ?? 'Error al crear transacción',
              isLoading: false,
            })
            return false
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false,
          })
          return false
        }
      },

      editTransaction: async (id, data) => {
        set({ isLoading: true, error: null })
        
        try {
          const result = await updateTransaction(id, data)

          if (result.success) {
            await get().fetchTransactions()
            set({ isLoading: false })
            return true
          } else {
            set({
              error: result.error ?? 'Error al actualizar transacción',
              isLoading: false,
            })
            return false
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false,
          })
          return false
        }
      },

      changeStatus: async (id, status, reason) => {
        set({ isLoading: true, error: null })
        
        try {
          const result = await updateTransactionStatus({ id, status, reason })

          if (result.success) {
            await get().fetchTransactions()
            set({ isLoading: false })
            return true
          } else {
            set({
              error: result.error ?? 'Error al cambiar estado',
              isLoading: false,
            })
            return false
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false,
          })
          return false
        }
      },

      removeTransaction: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          const result = await deleteTransaction(id)

          if (result.success) {
            await get().fetchTransactions()
            set({ isLoading: false })
            return true
          } else {
            set({
              error: result.error ?? 'Error al eliminar transacción',
              isLoading: false,
            })
            return false
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false,
          })
          return false
        }
      },
    }),
    { name: 'transaction-store' }
  )
)
