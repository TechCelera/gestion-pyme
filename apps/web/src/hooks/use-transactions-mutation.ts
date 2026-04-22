import { useState } from 'react'
import { useTransactionStore } from '@/stores/transaction-store'
import { toast } from 'sonner'
import type { UpdateTransactionInput, TransactionStatus } from '@/lib/validations/transaction'

export function useUpdateTransaction() {
  const [isLoading, setIsLoading] = useState(false)
  const editTransaction = useTransactionStore((state) => state.editTransaction)

  const update = async (id: string, data: UpdateTransactionInput) => {
    setIsLoading(true)
    
    try {
      const result = await editTransaction(id, data)
      
      if (result) {
        toast.success('Transacción actualizada exitosamente')
        return true
      } else {
        toast.error('Error al actualizar la transacción')
        return false
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    update,
    isLoading,
  }
}

export function useTransactionStatus() {
  const [isLoading, setIsLoading] = useState(false)
  const changeStatus = useTransactionStore((state) => state.changeStatus)

  const approve = async (id: string) => {
    setIsLoading(true)
    
    try {
      const result = await changeStatus(id, 'approved')
      
      if (result) {
        toast.success('Transacción aprobada')
        return true
      } else {
        toast.error('Error al aprobar la transacción')
        return false
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const reject = async (id: string, reason: string) => {
    setIsLoading(true)
    
    try {
      const result = await changeStatus(id, 'rejected', reason)
      
      if (result) {
        toast.success('Transacción rechazada')
        return true
      } else {
        toast.error('Error al rechazar la transacción')
        return false
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const post = async (id: string) => {
    setIsLoading(true)
    
    try {
      const result = await changeStatus(id, 'posted')
      
      if (result) {
        toast.success('Transacción contabilizada')
        return true
      } else {
        toast.error('Error al contabilizar la transacción')
        return false
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const sendToApproval = async (id: string) => {
    setIsLoading(true)
    
    try {
      const result = await changeStatus(id, 'pending')
      
      if (result) {
        toast.success('Transacción enviada a aprobación')
        return true
      } else {
        toast.error('Error al enviar a aprobación')
        return false
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    approve,
    reject,
    post,
    sendToApproval,
    isLoading,
  }
}

export function useDeleteTransaction() {
  const [isLoading, setIsLoading] = useState(false)
  const removeTransaction = useTransactionStore((state) => state.removeTransaction)

  const remove = async (id: string) => {
    setIsLoading(true)
    
    try {
      const result = await removeTransaction(id)
      
      if (result) {
        toast.success('Transacción eliminada')
        return true
      } else {
        toast.error('Error al eliminar la transacción')
        return false
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    remove,
    isLoading,
  }
}
