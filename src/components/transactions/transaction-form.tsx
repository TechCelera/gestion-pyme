'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Transaction } from '@/lib/actions/transactions'
import type {
  CreateTransactionInput,
  TransactionType,
  TransactionMethod,
} from '@/lib/validations/transaction'

interface TransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateTransactionInput, asDraft: boolean) => void
  transaction?: Transaction | null
  isLoading?: boolean
}

const transactionTypes: { value: TransactionType; label: string }[] = [
  { value: 'income', label: 'Ingreso' },
  { value: 'expense', label: 'Egreso' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'adjustment', label: 'Ajuste' },
]

const methods: { value: TransactionMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'accrual', label: 'Crédito' },
]

export function TransactionForm({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  isLoading,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('income')
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState<TransactionMethod>('cash')
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [destinationAccountId, setDestinationAccountId] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')

  const isEditing = !!transaction

  useEffect(() => {
    if (transaction) {
      setType(transaction.type)
      setDate(format(new Date(transaction.date), 'yyyy-MM-dd'))
      setAccountId(transaction.accountId)
      setCategoryId(transaction.categoryId || '')
      setAmount(transaction.amount.toString())
      setCurrency(transaction.currency)
      setDescription(transaction.description)
      setMethod('cash')
    } else {
      resetForm()
    }
  }, [transaction, isOpen])

  const resetForm = () => {
    setType('income')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setAccountId('')
    setCategoryId('')
    setAmount('')
    setCurrency('USD')
    setDescription('')
    setMethod('cash')
    setSourceAccountId('')
    setDestinationAccountId('')
    setAdjustmentReason('')
  }

  const handleSubmit = (asDraft: boolean) => {
    const data: CreateTransactionInput = {
      type,
      date: new Date(date),
      amount: parseFloat(amount),
      currency,
      description,
      method,
      ...(type === 'income' || type === 'expense'
        ? { accountId, categoryId: categoryId || undefined }
        : {}),
      ...(type === 'transfer'
        ? { sourceAccountId, destinationAccountId }
        : {}),
      ...(type === 'adjustment'
        ? { accountId, adjustmentReason: adjustmentReason as any }
        : {}),
    }

    onSubmit(data, asDraft)
    if (!isEditing) {
      resetForm()
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Tipo */}
          <div className="grid gap-2">
            <Label>Tipo de Transacción</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as TransactionType)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha */}
          <div className="grid gap-2">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Cuenta o Cuentas según tipo */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Cuenta Origen</Label>
                <Input
                  placeholder="ID Cuenta"
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Cuenta Destino</Label>
                <Input
                  placeholder="ID Cuenta"
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label>Cuenta</Label>
              <Input
                placeholder="ID de cuenta"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            </div>
          )}

          {/* Categoría - solo para income/expense */}
          {(type === 'income' || type === 'expense') && (
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Input
                placeholder="ID de categoría"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              />
            </div>
          )}

          {/* Motivo de ajuste - solo para adjustment */}
          {type === 'adjustment' && (
            <div className="grid gap-2">
              <Label>Motivo del Ajuste</Label>
              <Select
                value={adjustmentReason}
                onValueChange={(value) => setAdjustmentReason(value ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reconciliation">Conciliación</SelectItem>
                  <SelectItem value="correction">Corrección</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Monto y Moneda */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={(value) => setCurrency(value ?? 'USD')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="COP">COP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Método */}
          <div className="grid gap-2">
            <Label>Método</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as TransactionMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Input
              placeholder="Descripción de la transacción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={() => handleSubmit(true)}
              disabled={isLoading}
            >
              Guardar Borrador
            </Button>
          )}
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isLoading}
            className="bg-[#7B68EE] hover:bg-[#7B68EE]/90"
          >
            {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Enviar Aprobación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
