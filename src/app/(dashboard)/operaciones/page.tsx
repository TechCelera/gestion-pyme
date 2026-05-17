'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowDownLeft, ArrowUpRight, ChevronDown, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MovementTable } from '@/components/movements/movement-table'
import { MovementForm } from '@/components/movements/movement-form'
import { useMovementStore } from '@/stores/movement-store'
import { useAuthStore } from '@/stores/auth-store'
import type { CreateMovementInput, MovementType } from '@/lib/validations/movement'
import {
  OPERACIONES_FLOW_TABS,
  operacionesFlowHint,
  operacionesFlowToTypeFilter,
  parseOperacionesFlow,
  type OperacionesFlowKey,
} from '@/lib/movements/operaciones-flow'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function OperacionesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formMode, setFormMode] = useState<MovementType | null>(null)

  const {
    movements,
    pagination,
    isLoading,
    error,
    fetchMovements,
    addMovement,
    changeStatus,
    removeMovement,
    setPagination,
    setFilters,
  } = useMovementStore()

  const flowKey = parseOperacionesFlow(searchParams.get('flujo'))

  const setFlowFilter = useCallback(
    (next: OperacionesFlowKey) => {
      if (next === 'all') router.replace('/operaciones', { scroll: false })
      else router.replace(`/operaciones?flujo=${next}`, { scroll: false })
    },
    [router]
  )

  useEffect(() => {
    setFilters({ type: operacionesFlowToTypeFilter(flowKey) })
    void useMovementStore.getState().fetchMovements()
  }, [flowKey, setFilters])

  const openForm = useCallback((mode: MovementType) => {
    setFormMode(mode)
    setIsModalOpen(true)
  }, [])

  const handleOpenModal = useCallback(() => {
    openForm('income')
  }, [openForm])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        handleOpenModal()
      }
      if (e.key === 'Escape') {
        setIsModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleOpenModal])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormMode(null)
  }

  const handleSubmit = async (data: CreateMovementInput, asDraft: boolean) => {
    const success = await addMovement(data, asDraft)
    if (success) {
      toast.success(
        asDraft
          ? 'Movimiento guardado como borrador'
          : 'Movimiento enviado correctamente'
      )
      handleCloseModal()
    } else {
      const msg = useMovementStore.getState().error
      toast.error(msg ?? 'Error al crear el movimiento')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este movimiento?')) return

    const success = await removeMovement(id)
    if (success) {
      toast.success('Movimiento eliminado')
    } else {
      toast.error('Error al eliminar el movimiento')
    }
  }

  const handleApprove = async (id: string) => {
    const success = await changeStatus(id, 'approved')
    if (success) {
      toast.success('Movimiento aprobado y registrado en el libro')
    } else {
      toast.error('Error al aprobar el movimiento')
    }
  }

  const handleCancel = async (id: string) => {
    const reason = window.prompt('Motivo de la anulación (obligatorio):')
    if (reason === null) return
    const trimmed = reason.trim()
    if (!trimmed) {
      toast.error('Debes indicar un motivo para anular')
      return
    }
    const success = await changeStatus(id, 'cancelled', trimmed)
    if (success) {
      toast.success('Movimiento anulado')
    } else {
      toast.error('Error al anular el movimiento')
    }
  }

  const handleSendToApproval = async (id: string) => {
    const success = await changeStatus(id, 'pending')
    if (success) {
      toast.success('Movimiento enviado a aprobación')
    } else {
      toast.error('Error al enviar el movimiento a aprobación')
    }
  }

  const handlePageChange = (page: number) => {
    setPagination({ page })
  }

  const isDemoMode = useAuthStore((state) => state.isDemoMode)
  const clearUser = useAuthStore((state) => state.clearUser)
  const isAuthError = !!error && (error.includes('no autenticado') || error.includes('sin empresa'))

  useEffect(() => {
    if (isDemoMode || !isAuthError) return
    clearUser()
    router.replace('/login')
  }, [isDemoMode, isAuthError, clearUser, router])

  // Solo ocultar errores de auth en modo demo
  const isDemoError = isDemoMode && (error?.includes('no autenticado') || error?.includes('demo'))
  const showError = !!error && !isDemoError

  return (
    <div className="space-y-6 p-6">
      {/* Error Message */}
      {showError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-red-700">
                {isAuthError
                  ? 'Sesión expirada'
                  : 'Error al cargar datos'}
              </p>
              <p className="text-sm text-red-600">
                {isAuthError
                  ? 'Tu sesión ha expirado. Intenta recargar la página o iniciar sesión de nuevo.'
                  : error}
              </p>
            </div>
            <div className="flex gap-2">
              {isAuthError ? (
                <Button onClick={() => window.location.href = '/login'} variant="default" size="sm" className="bg-[#7B68EE] hover:bg-[#7B68EE]/90">
                  Iniciar sesión
                </Button>
              ) : null}
              <Button onClick={() => void fetchMovements()} variant="outline" size="sm">
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-muted-foreground">
            Registrá ingresos y egresos de tu empresa
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => openForm('income')}
            className="bg-green-600 hover:bg-green-600/90"
          >
            <ArrowDownLeft className="mr-2 h-4 w-4" />
            Registrar ingreso
          </Button>
          <Button
            onClick={() => openForm('expense')}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Registrar egreso
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <MoreHorizontal className="mr-1 h-4 w-4" />
                  Otras operaciones
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openForm('transfer')}>
                Transferencia entre cuentas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openForm('adjustment')}>
                Ajuste de saldo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-xl border bg-muted/40 p-1.5 shadow-sm">
        <p className="px-2 pb-1.5 text-xs text-muted-foreground sm:hidden">
          Elegí qué querés ver
        </p>
        <div
          role="tablist"
          aria-label="Filtro de movimientos"
          className="flex flex-col gap-1 sm:flex-row sm:items-stretch"
        >
          {OPERACIONES_FLOW_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={flowKey === key}
              onClick={() => setFlowFilter(key)}
              className={cn(
                'flex-1 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors sm:text-center',
                flowKey === key
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="hidden px-2 pt-1.5 text-xs text-muted-foreground sm:block">
          {operacionesFlowHint(flowKey)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {movements.filter((o) => o.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprobadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {movements.filter((o) => o.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Impactan saldo e informes</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <MovementTable
        movements={movements}
        onDelete={handleDelete}
        onSendToApproval={handleSendToApproval}
        onApprove={handleApprove}
        onCancel={handleCancel}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {movements.length} de {pagination.total} movimientos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
            >
              Anterior
            </Button>
            <span className="flex items-center px-2 text-sm">
              Página {pagination.page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={
                pagination.page * pagination.pageSize >= pagination.total ||
                isLoading
              }
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      <MovementForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        movement={null}
        isLoading={isLoading}
        fixedType={formMode}
      />
    </div>
  )
}
