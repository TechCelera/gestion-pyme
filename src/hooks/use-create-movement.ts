import { useState } from 'react'
import { useMovementStore } from '@/stores/movement-store'
import { toast } from 'sonner'
import type { CreateMovementInput } from '@/lib/validations/movement'

export function useCreateMovement() {
  const [isLoading, setIsLoading] = useState(false)
  const addMovement = useMovementStore((state) => state.addMovement)

  const create = async (data: CreateMovementInput, sendToApproval = false) => {
    setIsLoading(true)

    try {
      const ok = await addMovement(data, !sendToApproval)

      if (ok) {
        toast.success('Movimiento creado exitosamente')
        return true
      }
      toast.error('Error al crear el movimiento')
      return false
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    create,
    isLoading,
  }
}
