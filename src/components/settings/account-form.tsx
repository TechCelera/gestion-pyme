'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { createAccount, updateAccount } from '@/lib/actions/accounts'
import type { Account } from '@/lib/actions/accounts'
import { OperatingCurrencyHint } from '@/components/ui/operating-currency-hint'
import { useCompanyOperatingCurrency } from '@/hooks/use-company-operating-currency'
import { ACCOUNT_TYPE_LABELS } from '@/lib/constants'

interface AccountFormProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  account?: Account | null
}

const accountTypes = Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export function AccountForm({ isOpen, onClose, onSaved, account }: AccountFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState('bank')
  const { currency: operatingCurrency } = useCompanyOperatingCurrency(isOpen)
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!account

  const resetForm = useCallback(() => {
    setName('')
    setType('bank')
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      if (account) {
        setName(account.name)
        setType(account.type)
      } else if (isOpen) {
        resetForm()
      }
    })
  }, [account, isOpen, resetForm])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      if (isEditing && account) {
        const result = await updateAccount(account.id, {
          name: name.trim(),
          type,
        })
        if (result.success) {
          toast.success('Cuenta actualizada exitosamente')
          handleClose()
          onSaved()
        } else {
          toast.error(result.error || 'Error al actualizar la cuenta')
        }
      } else {
        const result = await createAccount({
          name: name.trim(),
          type,
          currency: operatingCurrency,
          balance: 0,
        })
        if (result.success) {
          toast.success('Cuenta creada exitosamente')
          handleClose()
          onSaved()
        } else {
          toast.error(result.error || 'Error al crear la cuenta')
        }
      }
    } catch {
      toast.error('Error inesperado')
    } finally {
      setIsSaving(false)
    }
  }

  const typeLabel = accountTypes.find((t) => t.value === type)?.label ?? ''

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b space-y-1">
          <SheetTitle className="text-lg">
            {isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Modifica los datos de la cuenta'
              : 'Completa los datos para crear una nueva cuenta'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accountName">Nombre</Label>
              <Input
                id="accountName"
                placeholder="Ej: Cuenta Corriente"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType">Tipo</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v ?? 'bank')}
                disabled={isSaving}
              >
                <SelectTrigger id="accountType" className="w-full">
                  {typeLabel || <span className="text-muted-foreground">Seleccione tipo</span>}
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <OperatingCurrencyHint
              currency={operatingCurrency}
              legacyCurrency={isEditing && account ? account.currency : undefined}
            />
          </div>
        </div>

        <SheetFooter className="border-t bg-muted/50 px-6 py-4 flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSaving}
            className="bg-[#7B68EE] hover:bg-[#7B68EE]/90 w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : isEditing ? (
              'Guardar Cambios'
            ) : (
              'Crear Cuenta'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
