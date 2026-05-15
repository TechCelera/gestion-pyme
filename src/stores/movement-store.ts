import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Movement } from '@/lib/actions/movements'
import type {
  MovementFilters,
  CreateMovementInput,
  MovementStatus,
} from '@/lib/validations/movement'
import {
  listMovements,
  createMovement,
  updateMovement,
  updateMovementStatus,
  finalizeMovementSubmission,
  deleteMovement as deleteMovementRemote,
} from '@/lib/actions/movements'
import { DEMO_MOVEMENTS } from '@/lib/demo-data'
import { useAuthStore } from './auth-store'

interface Pagination {
  page: number
  pageSize: number
  total: number
}

interface MovementStoreState {
  movements: Movement[]
  filters: MovementFilters
  pagination: Pagination
  isLoading: boolean
  error: string | null

  setFilters: (filters: Partial<MovementFilters>) => void
  setPagination: (pagination: Partial<Pagination>) => void
  resetFilters: () => void

  fetchMovements: () => Promise<void>
  addMovement: (data: CreateMovementInput, asDraft?: boolean) => Promise<boolean>
  editMovement: (id: string, data: CreateMovementInput) => Promise<boolean>
  changeStatus: (id: string, status: MovementStatus, reason?: string) => Promise<boolean>
  removeMovement: (id: string) => Promise<boolean>
}

const defaultFilters: MovementFilters = {
  page: 1,
  pageSize: 50,
}

const defaultPagination: Pagination = {
  page: 1,
  pageSize: 50,
  total: 0,
}

export const useMovementStore = create<MovementStoreState>()(
  devtools(
    (set, get) => ({
      movements: [],
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

      fetchMovements: async () => {
        set({ isLoading: true, error: null })

        try {
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            const { filters, pagination } = get()
            let filtered = [...DEMO_MOVEMENTS]

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
              movements: pageRows,
              pagination: {
                ...pagination,
                total: filtered.length,
              },
              isLoading: false,
            })
            return
          }

          const { filters, pagination } = get()
          const result = await listMovements({
            ...filters,
            page: pagination.page,
            pageSize: pagination.pageSize,
          })

          if (result.success && result.data) {
            set({
              movements: result.data.movements,
              pagination: {
                ...pagination,
                total: result.data.total,
              },
              isLoading: false,
            })
          } else {
            set({
              error: result.error ?? 'Error al cargar movimientos',
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

      addMovement: async (data, asDraft = true) => {
        set({ isLoading: true, error: null })

        try {
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            set({ isLoading: false })
            return true
          }

          const result = await createMovement(data)

          if (result.success) {
            if (!asDraft && result.data?.id) {
              const fin = await finalizeMovementSubmission(result.data.id)

              if (!fin.success) {
                set({
                  error:
                    fin.error ??
                    'Movimiento creado, pero no se pudo completar el envío o registro',
                  isLoading: false,
                })
                return false
              }
            }

            await get().fetchMovements()
            set({ isLoading: false })
            return true
          }
          set({
            error: result.error ?? 'Error al crear el movimiento',
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

      editMovement: async (id, data) => {
        set({ isLoading: true, error: null })

        try {
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            set({ isLoading: false })
            return true
          }

          const result = await updateMovement(id, data)

          if (result.success) {
            await get().fetchMovements()
            set({ isLoading: false })
            return true
          }
          set({
            error: result.error ?? 'Error al actualizar el movimiento',
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

          const result = await updateMovementStatus({ id, status, reason })

          if (result.success) {
            await get().fetchMovements()
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

      removeMovement: async (id) => {
        set({ isLoading: true, error: null })

        try {
          const isDemoMode = useAuthStore.getState().isDemoMode

          if (isDemoMode) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            set({ isLoading: false })
            return true
          }

          const result = await deleteMovementRemote(id)

          if (result.success) {
            await get().fetchMovements()
            set({ isLoading: false })
            return true
          }
          set({
            error: result.error ?? 'Error al eliminar el movimiento',
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
    { name: 'movement-store' }
  )
)
