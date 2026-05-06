import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Operation } from '@/lib/actions/operations'
import type {
  OperationFilters,
  CreateOperationInput,
  OperationStatus,
} from '@/lib/validations/operation'
import {
  listOperations,
  createOperation,
  updateOperation,
  updateOperationStatus,
  deleteOperation as deleteOperationRemote,
} from '@/lib/actions/operations'
import { DEMO_OPERATIONS } from '@/lib/demo-data'
import { useAuthStore } from './auth-store'

interface Pagination {
  page: number
  pageSize: number
  total: number
}

interface OperationStoreState {
  operations: Operation[]
  filters: OperationFilters
  pagination: Pagination
  isLoading: boolean
  error: string | null

  setFilters: (filters: Partial<OperationFilters>) => void
  setPagination: (pagination: Partial<Pagination>) => void
  resetFilters: () => void

  fetchOperations: () => Promise<void>
  addOperation: (data: CreateOperationInput, asDraft?: boolean) => Promise<boolean>
  editOperation: (id: string, data: CreateOperationInput) => Promise<boolean>
  changeStatus: (id: string, status: OperationStatus, reason?: string) => Promise<boolean>
  removeOperation: (id: string) => Promise<boolean>
}

const defaultFilters: OperationFilters = {
  page: 1,
  pageSize: 50,
}

const defaultPagination: Pagination = {
  page: 1,
  pageSize: 50,
  total: 0,
}

export const useOperationStore = create<OperationStoreState>()(
  devtools(
    (set, get) => ({
      operations: [],
      filters: defaultFilters,
      pagination: defaultPagination,
      isLoading: false,
      error: null,

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters, page: 1 },
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

      fetchOperations: async () => {
        set({ isLoading: true, error: null })

        try {
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            const { filters, pagination } = get()
            let filtered = [...DEMO_OPERATIONS]

            if (filters.status && filters.status.length > 0) {
              filtered = filtered.filter((o) => filters.status?.includes(o.status))
            }
            if (filters.type && filters.type.length > 0) {
              filtered = filtered.filter((o) => filters.type?.includes(o.type))
            }
            if (filters.search) {
              const searchLower = filters.search.toLowerCase()
              filtered = filtered.filter((o) =>
                o.description.toLowerCase().includes(searchLower)
              )
            }

            const start = (pagination.page - 1) * pagination.pageSize
            const end = start + pagination.pageSize
            const pageRows = filtered.slice(start, end)

            set({
              operations: pageRows,
              pagination: {
                ...pagination,
                total: filtered.length,
              },
              isLoading: false,
            })
            return
          }

          const { filters, pagination } = get()
          const result = await listOperations({
            ...filters,
            page: pagination.page,
            pageSize: pagination.pageSize,
          })

          if (result.success && result.data) {
            set({
              operations: result.data.operations,
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

      addOperation: async (data, asDraft = true) => {
        set({ isLoading: true, error: null })

        try {
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            set({ isLoading: false })
            return true
          }

          const result = await createOperation(data)

          if (result.success) {
            if (!asDraft && result.data?.id) {
              const statusResult = await updateOperationStatus({
                id: result.data.id,
                status: 'pending',
              })

              if (!statusResult.success) {
                set({
                  error:
                    statusResult.error ??
                    'Operación creada, pero no se pudo enviar a aprobación',
                  isLoading: false,
                })
                return false
              }
            }

            await get().fetchOperations()
            set({ isLoading: false })
            return true
          }
          set({
            error: result.error ?? 'Error al crear operación',
            isLoading: false,
          })
          return false
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false,
          })
          return false
        }
      },

      editOperation: async (id, data) => {
        set({ isLoading: true, error: null })

        try {
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            set({ isLoading: false })
            return true
          }

          const result = await updateOperation(id, data)

          if (result.success) {
            await get().fetchOperations()
            set({ isLoading: false })
            return true
          }
          set({
            error: result.error ?? 'Error al actualizar operación',
            isLoading: false,
          })
          return false
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
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            set({ isLoading: false })
            return true
          }

          const result = await updateOperationStatus({ id, status, reason })

          if (result.success) {
            await get().fetchOperations()
            set({ isLoading: false })
            return true
          }
          set({
            error: result.error ?? 'Error al cambiar estado',
            isLoading: false,
          })
          return false
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false,
          })
          return false
        }
      },

      removeOperation: async (id) => {
        set({ isLoading: true, error: null })

        try {
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            set({ isLoading: false })
            return true
          }

          const result = await deleteOperationRemote(id)

          if (result.success) {
            await get().fetchOperations()
            set({ isLoading: false })
            return true
          }
          set({
            error: result.error ?? 'Error al eliminar operación',
            isLoading: false,
          })
          return false
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false,
          })
          return false
        }
      },
    }),
    { name: 'operation-store' }
  )
)
