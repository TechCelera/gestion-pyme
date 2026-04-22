import { useState } from 'react'
import { useTransactionStore } from '@/stores/transaction-store'
import { toast } from 'sonner'
import type { CreateTransactionInput } from '@/lib/validations/transaction'

export function useCreateTransaction() {
  const [isLoading, setIsLoading] = useState(false)
  const addTransaction = useTransactionStore((state) => state.addTransaction)

  const create = async (data: CreateTransactionInput, sendToApproval = false) => {
    setIsLoading(true)
    
    try {
      const result = await addTransaction(data)
      
      if (result) {
        toast.success('Transacción creada exitosamente')
        return true
      } else {
        toast.error('Error al crear la transacción')
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
    create,
    isLoading,
  }
}
