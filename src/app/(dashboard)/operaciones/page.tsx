'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  LayoutList,
  SlidersHorizontal,
  Tag,
} from 'lucide-react'
import { PageTabsBar } from '@/components/ui/page-tabs'
import { ROUTES, isFinanceApproverRole } from '@/lib/constants'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MovementTable } from '@/components/movements/movement-table'
import { MovementForm } from '@/components/movements/movement-form'
import { CancelMovementDialog } from '@/components/movements/cancel-movement-dialog'
import { UserRoleBadge } from '@/components/layout/user-role-badge'
import { useMovementStore } from '@/stores/movement-store'
import { useAuthStore } from '@/stores/auth-store'
import type { CreateMovementInput, MovementType } from '@/lib/validations/movement'
import {
  operacionesFlowHint,
  operacionesFlowToTypeFilter,
  parseOperacionesFlow,
  type OperacionesFlowKey,
} from '@/lib/movements/operaciones-flow'
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
  const [cancelMovementId, setCancelMovementId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

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

  const handleCancelRequest = (id: string) => {
    setCancelMovementId(id)
  }

  const handleCancelConfirm = async (reason: string) => {
    if (!cancelMovementId) return

    setIsCancelling(true)
    try {
      const success = await changeStatus(cancelMovementId, 'cancelled', reason)
      if (success) {
        toast.success('Movimiento anulado')
        setCancelMovementId(null)
      } else {
        const msg = useMovementStore.getState().error
        toast.error(msg ?? 'Error al anular el movimiento')
      }
    } finally {
      setIsCancelling(false)
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

  const clearUser = useAuthStore((state) => state.clearUser)
  const role = useAuthStore((state) => state.role)
  const canManageFinanceActions = isFinanceApproverRole(role)
  const isAuthError = !!error && (error.includes('no autenticado') || error.includes('sin empresa'))

  useEffect(() => {
    if (!isAuthError) return
    clearUser()
    router.replace('/login')
  }, [isAuthError, clearUser, router])

  const showError = !!error

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
      <header className="space-y-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
            <p className="text-sm text-muted-foreground">
              Registrá ingresos y egresos de tu empresa
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto lg:min-w-[min(100%,28rem)]">
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => openForm('income')}
                className="h-10 w-full bg-green-600 px-2 hover:bg-green-600/90 sm:px-3"
              >
                <ArrowDownLeft className="h-4 w-4 shrink-0 sm:mr-1.5" />
                <span className="truncate text-xs sm:text-sm">
                  <span className="hidden min-[420px]:inline">Registrar </span>
                  ingreso
                </span>
              </Button>
              <Button
                onClick={() => openForm('expense')}
                variant="outline"
                className="h-10 w-full border-red-200 px-2 text-red-700 hover:bg-red-50 sm:px-3 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <ArrowUpRight className="h-4 w-4 shrink-0 sm:mr-1.5" />
                <span className="truncate text-xs sm:text-sm">
                  <span className="hidden min-[420px]:inline">Registrar </span>
                  egreso
                </span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" className="h-10 w-full px-2 sm:px-3">
                      <SlidersHorizontal className="h-4 w-4 shrink-0 sm:mr-1.5" />
                      <span className="truncate text-xs sm:text-sm">Otras</span>
                      <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-60" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="min-w-[14rem]">
                  <DropdownMenuItem onClick={() => openForm('transfer')}>
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Transferencia entre cuentas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openForm('adjustment')}>
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Ajuste de saldo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full md:hidden">
              <Link href={ROUTES.CATEGORIES}>
                <Tag className="mr-2 h-4 w-4" />
                Categorías
              </Link>
            </Button>
          </div>
        </div>

        <UserRoleBadge className="w-full items-center rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5" />
      </header>

      <div className="space-y-2">
        <PageTabsBar
          value={flowKey}
          onValueChange={(next) => setFlowFilter(next as OperacionesFlowKey)}
          tabs={[
            { value: 'all', label: 'Todo', icon: LayoutList },
            { value: 'ingresos', label: 'Ingresos', icon: ArrowDownLeft },
            { value: 'egresos', label: 'Egresos', icon: ArrowUpRight },
          ]}
        />
        <p className="text-xs text-muted-foreground">{operacionesFlowHint(flowKey)}</p>
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
        onCancel={handleCancelRequest}
        canManageFinanceActions={canManageFinanceActions}
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

      <CancelMovementDialog
        open={cancelMovementId !== null}
        onOpenChange={(open) => {
          if (!open && !isCancelling) setCancelMovementId(null)
        }}
        onConfirm={handleCancelConfirm}
        isSubmitting={isCancelling}
      />

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
