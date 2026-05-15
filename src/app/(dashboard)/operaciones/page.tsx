'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MovementTable } from '@/components/movements/movement-table'
import { MovementForm } from '@/components/movements/movement-form'
import { useMovementStore } from '@/stores/movement-store'
import { useAuthStore } from '@/stores/auth-store'
import type { CreateMovementInput } from '@/lib/validations/movement'

export default function OperacionesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const flujo = searchParams.get('flujo')

  useEffect(() => {
    if (flujo === 'ventas') setFilters({ type: ['income'] })
    else if (flujo === 'compras') setFilters({ type: ['expense'] })
    else setFilters({ type: undefined })
    void useMovementStore.getState().fetchMovements()
  }, [flujo, setFilters])

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

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

  const filterHint =
    flujo === 'ventas'
      ? 'Mostrando ventas y cobros (ingresos).'
      : flujo === 'compras'
        ? 'Mostrando compras y pagos (egresos).'
        : null

  const handleCloseModal = () => {
    setIsModalOpen(false)
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
      toast.error('Error al crear el movimiento')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-muted-foreground">
            Gestiona los ingresos, egresos y transferencias de tu empresa
          </p>
        </div>
        <Button
          onClick={handleOpenModal}
          className="bg-[#7B68EE] hover:bg-[#7B68EE]/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo movimiento
        </Button>
      </div>

      {filterHint ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground -mt-2">
          <span>{filterHint}</span>
          <Button variant="link" className="h-auto p-0 text-primary" asChild>
            <Link href="/operaciones">Ver todos</Link>
          </Button>
        </div>
      ) : null}

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
      />
    </div>
  )
}
