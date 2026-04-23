'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  ArrowRightLeft, 
  Wallet, 
  CreditCard, 
  Settings, 
  Calendar,
  DollarSign,
  FileText,
  Tag
} from 'lucide-react'

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
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
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

const transactionTypes: { value: TransactionType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'income', label: 'Ingreso', icon: Wallet, color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'expense', label: 'Egreso', icon: CreditCard, color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'transfer', label: 'Transferencia', icon: ArrowRightLeft, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'adjustment', label: 'Ajuste', icon: Settings, color: 'bg-orange-100 text-orange-700 border-orange-200' },
]

const methods: { value: TransactionMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'accrual', label: 'Crédito' },
]

const currencies = [
  { value: 'USD', label: 'USD ($)', flag: '🇺🇸' },
  { value: 'COP', label: 'COP ($)', flag: '🇨🇴' },
  { value: 'EUR', label: 'EUR (€)', flag: '🇪🇺' },
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
  const [currency, setCurrency] = useState('COP')
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState<TransactionMethod>('cash')
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [destinationAccountId, setDestinationAccountId] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')

  const isEditing = !!transaction
  const selectedType = transactionTypes.find(t => t.value === type)

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
    setCurrency('COP')
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

  const TypeIcon = selectedType?.icon || Wallet

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${selectedType?.color || ''}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-lg">
                {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
              </SheetTitle>
              <SheetDescription>
                {isEditing 
                  ? 'Modifica los datos de la transacción' 
                  : 'Completa los datos para registrar una nueva transacción'}
              </SheetDescription>
            </div>
          </div>
          
          {/* Type Selector - Pills */}
          {!isEditing && (
            <div className="flex flex-wrap gap-2 pt-2">
              {transactionTypes.map((t) => {
                const Icon = t.icon
                const isSelected = type === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected 
                        ? `${t.color} ring-2 ring-offset-1` 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          )}
          
          {isEditing && selectedType && (
            <Badge variant="outline" className={`w-fit ${selectedType.color}`}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {selectedType.label}
            </Badge>
          )}
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            
            {/* Section: Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Información General</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Método</Label>
                  <Select 
                    value={method} 
                    onValueChange={(v) => setMethod(v as TransactionMethod)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="method">
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
              </div>
            </div>

            <Separator />

            {/* Section: Accounts */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Wallet className="h-4 w-4" />
                <span>Cuentas</span>
              </div>

              {type === 'transfer' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourceAccount">Origen</Label>
                    <Input
                      id="sourceAccount"
                      placeholder="ID Cuenta"
                      value={sourceAccountId}
                      onChange={(e) => setSourceAccountId(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destAccount">Destino</Label>
                    <Input
                      id="destAccount"
                      placeholder="ID Cuenta"
                      value={destinationAccountId}
                      onChange={(e) => setDestinationAccountId(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="account">
                    {type === 'adjustment' ? 'Cuenta a Ajustar' : 'Cuenta'}
                  </Label>
                  <Input
                    id="account"
                    placeholder="ID de cuenta"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>

            {/* Category - only for income/expense */}
            {(type === 'income' || type === 'expense') && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span>Categorización</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Input
                      id="category"
                      placeholder="ID de categoría"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Adjustment Reason */}
            {type === 'adjustment' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Settings className="h-4 w-4" />
                    <span>Motivo del Ajuste</span>
                  </div>
                  <div className="space-y-2">
                    <Select
                      value={adjustmentReason}
                      onValueChange={(value) => setAdjustmentReason(value ?? '')}
                      disabled={isLoading}
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
                </div>
              </>
            )}

            <Separator />

            {/* Section: Amount */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Monto</span>
              </div>
              
              <div className="grid grid-cols-[1fr,auto] gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isLoading}
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2 w-28">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select 
                    value={currency} 
                    onValueChange={(value) => setCurrency(value ?? 'COP')}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <span className="mr-2">{c.flag}</span>
                          {c.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section: Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Descripción</span>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Describe la transacción..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="border-t bg-muted/50 px-6 py-4 flex-col-reverse sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={() => handleSubmit(true)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Guardar Borrador
            </Button>
          )}
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isLoading}
            className="bg-[#7B68EE] hover:bg-[#7B68EE]/90 w-full sm:w-auto"
          >
            {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Enviar Aprobación'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
