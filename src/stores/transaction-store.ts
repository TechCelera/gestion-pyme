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
import { DEMO_TRANSACTIONS } from '@/lib/demo-data'
import { useAuthStore } from './auth-store'

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
  addTransaction: (data: CreateTransactionInput, asDraft?: boolean) => Promise<boolean>
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
          // Verificar si estamos en modo demo
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            // Usar datos de demo locales
            const { filters, pagination } = get()
            let filteredTransactions = [...DEMO_TRANSACTIONS]

            // Aplicar filtros
            if (filters.status && filters.status.length > 0) {
              filteredTransactions = filteredTransactions.filter(
                t => filters.status?.includes(t.status)
              )
            }
            if (filters.type && filters.type.length > 0) {
              filteredTransactions = filteredTransactions.filter(
                t => filters.type?.includes(t.type)
              )
            }
            if (filters.search) {
              const searchLower = filters.search.toLowerCase()
              filteredTransactions = filteredTransactions.filter(
                t => t.description.toLowerCase().includes(searchLower)
              )
            }

            // Paginación
            const start = (pagination.page - 1) * pagination.pageSize
            const end = start + pagination.pageSize
            const paginatedTransactions = filteredTransactions.slice(start, end)

            set({
              transactions: paginatedTransactions,
              pagination: {
                ...pagination,
                total: filteredTransactions.length,
              },
              isLoading: false,
            })
            return
          }

          // Modo normal: llamar a Supabase
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
              error: result.error ?? 'Error al cargar operaciones',
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

      addTransaction: async (data, asDraft = true) => {
        set({ isLoading: true, error: null })

        try {
          // Verificar si estamos en modo demo
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            // En modo demo, simular creación
            await new Promise(resolve => setTimeout(resolve, 500))
            set({ isLoading: false })
            return true
          }

          const result = await createTransaction(data)

          if (result.success) {
            // RPC create_transaction always creates DRAFT.
            // If the user selected "Enviar aprobación", transition to PENDING immediately.
            if (!asDraft && result.data?.id) {
              const statusResult = await updateTransactionStatus({
                id: result.data.id,
                status: 'pending',
              })

              if (!statusResult.success) {
                set({
                  error: statusResult.error ?? 'Operación creada, pero no se pudo enviar a aprobación',
                  isLoading: false,
                })
                return false
              }
            }

            await get().fetchTransactions()
            set({ isLoading: false })
            return true
          } else {
            set({
              error: result.error ?? 'Error al crear operación',
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
          // Verificar si estamos en modo demo
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            // En modo demo, simular actualización
            await new Promise(resolve => setTimeout(resolve, 500))
            set({ isLoading: false })
            return true
          }

          const result = await updateTransaction(id, data)

          if (result.success) {
            await get().fetchTransactions()
            set({ isLoading: false })
            return true
          } else {
            set({
              error: result.error ?? 'Error al actualizar operación',
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
          // Verificar si estamos en modo demo
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            // En modo demo, simular cambio de estado
            await new Promise(resolve => setTimeout(resolve, 500))
            set({ isLoading: false })
            return true
          }

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
          // Verificar si estamos en modo demo
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            // En modo demo, simular eliminación
            await new Promise(resolve => setTimeout(resolve, 500))
            set({ isLoading: false })
            return true
          }

          const result = await deleteTransaction(id)

          if (result.success) {
            await get().fetchTransactions()
            set({ isLoading: false })
            return true
          } else {
            set({
              error: result.error ?? 'Error al eliminar operación',
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
