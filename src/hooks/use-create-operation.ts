import { useState } from 'react'
import { useOperationStore } from '@/stores/operation-store'
import { toast } from 'sonner'
import type { CreateOperationInput } from '@/lib/validations/operation'

export function useCreateOperation() {
  const [isLoading, setIsLoading] = useState(false)
  const addOperation = useOperationStore((state) => state.addOperation)

  const create = async (data: CreateOperationInput, sendToApproval = false) => {
    setIsLoading(true)

    try {
      const ok = await addOperation(data, !sendToApproval)

      if (ok) {
        toast.success('Operación creada exitosamente')
        return true
      }
      toast.error('Error al crear la operación')
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
