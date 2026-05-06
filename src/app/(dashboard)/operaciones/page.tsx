'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OperationTable } from '@/components/operations/operation-table'
import { OperationForm } from '@/components/operations/operation-form'
import { useOperationStore } from '@/stores/operation-store'
import { useAuthStore } from '@/stores/auth-store'
import type { Operation } from '@/lib/actions/operations'
import type { CreateOperationInput } from '@/lib/validations/operation'

export default function OperacionesPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)

  const {
    operations,
    pagination,
    isLoading,
    error,
    fetchOperations,
    addOperation,
    editOperation,
    changeStatus,
    removeOperation,
    setPagination,
  } = useOperationStore()

  const handleOpenModal = useCallback(() => {
    setEditingOperation(null)
    setIsModalOpen(true)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchOperations()
    })
  }, [fetchOperations])

  // Atajo de teclado Ctrl+N
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

  const handleEdit = (operation: Operation) => {
    setEditingOperation(operation)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingOperation(null)
  }

  const handleSubmit = async (data: CreateOperationInput, asDraft: boolean) => {
    if (editingOperation) {
      const success = await editOperation(editingOperation.id, data)
      if (success) {
        toast.success('Operación actualizada exitosamente')
        handleCloseModal()
      } else {
        toast.error('Error al actualizar la operación')
      }
    } else {
      const success = await addOperation(data, asDraft)
      if (success) {
        toast.success(
          asDraft
            ? 'Operación guardada como borrador'
            : 'Operación enviada a aprobación'
        )
        handleCloseModal()
      } else {
        toast.error('Error al crear la operación')
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta operación?')) return

    const success = await removeOperation(id)
    if (success) {
      toast.success('Operación eliminada')
    } else {
      toast.error('Error al eliminar la operación')
    }
  }

  const handleApprove = async (id: string) => {
    const success = await changeStatus(id, 'approved')
    if (success) {
      toast.success('Operación aprobada')
    } else {
      toast.error('Error al aprobar la operación')
    }
  }

  const handleSendToApproval = async (id: string) => {
    const success = await changeStatus(id, 'pending')
    if (success) {
      toast.success('Operación enviada a aprobación')
    } else {
      toast.error('Error al enviar la operación a aprobación')
    }
  }

  const handlePost = async (id: string) => {
    const success = await changeStatus(id, 'posted')
    if (success) {
      toast.success('Operación contabilizada')
    } else {
      toast.error('Error al contabilizar la operación')
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
              <Button onClick={() => void fetchOperations()} variant="outline" size="sm">
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operaciones</h1>
          <p className="text-muted-foreground">
            Gestiona los ingresos, egresos y transferencias de tu empresa
          </p>
        </div>
        <Button
          onClick={handleOpenModal}
          className="bg-[#7B68EE] hover:bg-[#7B68EE]/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Operación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Operaciones
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
              {operations.filter((o) => o.status === 'pending').length}
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
            <div className="text-2xl font-bold text-[#7B68EE]">
              {operations.filter((o) => o.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contabilizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {operations.filter((o) => o.status === 'posted').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <OperationTable
        operations={operations}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSendToApproval={handleSendToApproval}
        onApprove={handleApprove}
        onPost={handlePost}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {operations.length} de {pagination.total} operaciones
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
      <OperationForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        operation={editingOperation}
        isLoading={isLoading}
      />
    </div>
  )
}
