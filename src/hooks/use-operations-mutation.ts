import { useState } from 'react'
import { useOperationStore } from '@/stores/operation-store'
import { toast } from 'sonner'
import type { CreateOperationInput } from '@/lib/validations/operation'

export function useUpdateOperation() {
  const [isLoading, setIsLoading] = useState(false)
  const editOperation = useOperationStore((state) => state.editOperation)

  const update = async (id: string, data: CreateOperationInput) => {
    setIsLoading(true)

    try {
      const result = await editOperation(id, data)

      if (result) {
        toast.success('Operación actualizada exitosamente')
        return true
      }
      toast.error('Error al actualizar la operación')
      return false
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

export function useOperationStatusActions() {
  const [isLoading, setIsLoading] = useState(false)
  const changeStatus = useOperationStore((state) => state.changeStatus)

  const approve = async (id: string) => {
    setIsLoading(true)

    try {
      const result = await changeStatus(id, 'approved')

      if (result) {
        toast.success('Operación aprobada')
        return true
      }
      toast.error('Error al aprobar la operación')
      return false
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
        toast.success('Operación rechazada')
        return true
      }
      toast.error('Error al rechazar la operación')
      return false
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
        toast.success('Operación contabilizada')
        return true
      }
      toast.error('Error al contabilizar la operación')
      return false
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
        toast.success('Operación enviada a aprobación')
        return true
      }
      toast.error('Error al enviar a aprobación')
      return false
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

export function useDeleteOperation() {
  const [isLoading, setIsLoading] = useState(false)
  const removeOperation = useOperationStore((state) => state.removeOperation)

  const remove = async (id: string) => {
    setIsLoading(true)

    try {
      const result = await removeOperation(id)

      if (result) {
        toast.success('Operación eliminada')
        return true
      }
      toast.error('Error al eliminar la operación')
      return false
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
