'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionTable } from '@/components/transactions/transaction-table'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { useTransactionStore } from '@/stores/transaction-store'
import { useAuthStore } from '@/stores/auth-store'
import type { Transaction } from '@/lib/actions/transactions'
import type { CreateTransactionInput } from '@/lib/validations/transaction'

export default function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const {
    transactions,
    pagination,
    isLoading,
    error,
    fetchTransactions,
    addTransaction,
    editTransaction,
    changeStatus,
    removeTransaction,
    setPagination,
  } = useTransactionStore()

  // Cargar transacciones al montar
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

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
  }, [])

  const handleOpenModal = () => {
    setEditingTransaction(null)
    setIsModalOpen(true)
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
  }

  const handleSubmit = async (data: CreateTransactionInput, asDraft: boolean) => {
    if (editingTransaction) {
      const success = await editTransaction(editingTransaction.id, data)
      if (success) {
        toast.success('Operación actualizada exitosamente')
        handleCloseModal()
      } else {
        toast.error('Error al actualizar la operación')
      }
    } else {
      const success = await addTransaction(data)
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

    const success = await removeTransaction(id)
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
                {error?.includes('no autenticado') || error?.includes('sin empresa')
                  ? 'Sesión expirada'
                  : 'Error al cargar datos'}
              </p>
              <p className="text-sm text-red-600">
                {error?.includes('no autenticado') || error?.includes('sin empresa')
                  ? 'Tu sesión ha expirado. Intenta recargar la página o iniciar sesión de nuevo.'
                  : error}
              </p>
            </div>
            <div className="flex gap-2">
              {error?.includes('no autenticado') || error?.includes('sin empresa') ? (
                <Button onClick={() => window.location.href = '/login'} variant="default" size="sm" className="bg-[#7B68EE] hover:bg-[#7B68EE]/90">
                  Iniciar sesión
                </Button>
              ) : null}
              <Button onClick={fetchTransactions} variant="outline" size="sm">
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transacciones</h1>
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
              {transactions.filter((t) => t.status === 'pending').length}
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
              {transactions.filter((t) => t.status === 'approved').length}
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
              {transactions.filter((t) => t.status === 'posted').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <TransactionTable
        transactions={transactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onPost={handlePost}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {transactions.length} de {pagination.total} operaciones
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
      <TransactionForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        transaction={editingTransaction}
        isLoading={isLoading}
      />
    </div>
  )
}
