import { useState } from 'react'
import { useMovementStore } from '@/stores/movement-store'
import { toast } from 'sonner'
import type { CreateMovementInput } from '@/lib/validations/movement'

export function useUpdateMovement() {
  const [isLoading, setIsLoading] = useState(false)
  const editMovement = useMovementStore((state) => state.editMovement)

  const update = async (id: string, data: CreateMovementInput) => {
    setIsLoading(true)

    try {
      const result = await editMovement(id, data)

      if (result) {
        toast.success('Movimiento actualizado exitosamente')
        return true
      }
      toast.error('Error al actualizar el movimiento')
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

export function useMovementStatusActions() {
  const [isLoading, setIsLoading] = useState(false)
  const changeStatus = useMovementStore((state) => state.changeStatus)

  const approve = async (id: string) => {
    setIsLoading(true)

    try {
      const result = await changeStatus(id, 'approved')

      if (result) {
        toast.success('Movimiento aprobado y registrado')
        return true
      }
      toast.error('Error al aprobar el movimiento')
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
        toast.success('Movimiento rechazado')
        return true
      }
      toast.error('Error al rechazar el movimiento')
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
        toast.success('Movimiento enviado a aprobación')
        return true
      }
      toast.error('Error al enviar el movimiento a aprobación')
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
    sendToApproval,
    isLoading,
  }
}

export function useDeleteMovement() {
  const [isLoading, setIsLoading] = useState(false)
  const removeMovement = useMovementStore((state) => state.removeMovement)

  const remove = async (id: string) => {
    setIsLoading(true)

    try {
      const result = await removeMovement(id)

      if (result) {
        toast.success('Movimiento eliminado')
        return true
      }
      toast.error('Error al eliminar el movimiento')
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
