'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { 
  ArrowRightLeft, 
  Wallet, 
  CreditCard, 
  Settings, 
  Calendar,
  DollarSign,
  FileText,
  Tag,
  Loader2,
  ArrowRight,
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
import { TRANSACTION_METHOD_LABELS, CATEGORY_TYPES } from '@/lib/constants'
import { getAccounts } from '@/lib/actions/accounts'
import { getCategories } from '@/lib/actions/categories'
import { getProjects } from '@/lib/actions/projects'
import type { Account } from '@/lib/actions/accounts'
import type { Category } from '@/lib/actions/categories'
import type { Project } from '@/lib/actions/projects'
import { DEMO_ACCOUNTS, DEMO_CATEGORIES } from '@/lib/demo-data'
import { useAuthStore } from '@/stores/auth-store'
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
  { value: 'transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'digital', label: 'Billetera Digital' },
  { value: 'other', label: 'Otro' },
]

const currencies = [
  { value: 'ARS', label: 'ARS ($)', flag: '🇦🇷' },
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
  const [currency, setCurrency] = useState('ARS')
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState<TransactionMethod>('cash')
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [destinationAccountId, setDestinationAccountId] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [fundOwner, setFundOwner] = useState<'company' | 'client_advance'>('company')
  const [operationScope, setOperationScope] = useState<'general' | 'project'>('general')
  const [projectId, setProjectId] = useState('')

  // Data from server
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  const isDemoMode = useAuthStore((state) => state.isDemoMode)
  const isEditing = !!transaction
  const selectedType = transactionTypes.find(t => t.value === type)

  // Fetch accounts and categories on open
  const loadFormData = useCallback(async () => {
    if (isDemoMode) {
      // Modo demo: usar datos locales
      setAccounts(DEMO_ACCOUNTS.map(a => ({ ...a })))
      setCategories(DEMO_CATEGORIES.map(c => ({ ...c })))
      return
    }

    setIsLoadingData(true)
    try {
      const [accountsResult, categoriesResult, projectsResult] = await Promise.all([
        getAccounts(),
        getCategories(),
        getProjects(),
      ])

      if (accountsResult.success && accountsResult.data) {
        setAccounts(accountsResult.data)
      }
      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data)
      }
      if (projectsResult.success && projectsResult.data) {
        setProjects(projectsResult.data)
      }
    } catch (error) {
      console.error('Error loading form data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    if (isOpen) {
      loadFormData()
    }
  }, [isOpen, loadFormData])

  // Reset form when transaction changes
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
      setFundOwner((transaction.fundOwner ?? 'company') as 'company' | 'client_advance')
      setProjectId(transaction.projectId ?? '')
      setOperationScope(transaction.projectId ? 'project' : 'general')
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
    setCurrency('ARS')
    setDescription('')
    setMethod('cash')
    setSourceAccountId('')
    setDestinationAccountId('')
    setAdjustmentReason('')
    setFundOwner('company')
    setProjectId('')
    setOperationScope('general')
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
      fundOwner,
      projectId: operationScope === 'project' ? projectId || undefined : undefined,
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

  // Filter categories by transaction type
  const filteredCategories = categories.filter((c) => {
    if (type === 'income') return c.type === CATEGORY_TYPES.INCOME
    if (type === 'expense') return ([
      CATEGORY_TYPES.COST,
      CATEGORY_TYPES.ADMIN_EXPENSE,
      CATEGORY_TYPES.COMMERCIAL_EXPENSE,
      CATEGORY_TYPES.FINANCIAL_EXPENSE,
    ] as string[]).includes(c.type)
    return false // No categories for transfer/adjustment
  })

  // Resolve display labels from current values (base-ui shows raw value, not label)
  const methodLabel = methods.find(m => m.value === method)?.label ?? ''
  const accountLabel = accountId ? (() => {
    const a = accounts.find(acc => acc.id === accountId)
    return a ? `${a.name} (${a.currency})` : ''
  })() : ''
  const sourceAccountLabel = sourceAccountId ? (() => {
    const a = accounts.find(acc => acc.id === sourceAccountId)
    return a ? `${a.name} (${a.currency})` : ''
  })() : ''
  const destAccountLabel = destinationAccountId ? (() => {
    const a = accounts.find(acc => acc.id === destinationAccountId)
    return a ? `${a.name} (${a.currency})` : ''
  })() : ''
  const categoryLabel = categoryId ? (() => {
    const c = categories.find(cat => cat.id === categoryId)
    return c?.name ?? ''
  })() : ''
  const adjustmentReasonLabels: Record<string, string> = {
    reconciliation: 'Conciliación',
    correction: 'Corrección',
    other: 'Otro',
  }
  const adjustmentReasonLabel = adjustmentReason ? adjustmentReasonLabels[adjustmentReason] ?? adjustmentReason : ''

  const TypeIcon = selectedType?.icon || Wallet
  const flattenProjects = (items: Project[], depth = 0): Array<{ id: string; name: string }> => {
    return items.flatMap((item) => {
      const prefix = depth > 0 ? `${'— '.repeat(depth)}` : ''
      const current = { id: item.id, name: `${prefix}${item.name}` }
      const children = item.children ? flattenProjects(item.children, depth + 1) : []
      return [current, ...children]
    })
  }
  const flatProjects = flattenProjects(projects)
  const projectLabel = projectId ? flatProjects.find((p) => p.id === projectId)?.name ?? '' : ''

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-md data-[side=right]:lg:max-w-lg p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${selectedType?.color || ''}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-lg">
                {isEditing ? 'Editar Operación' : 'Nueva Operación'}
              </SheetTitle>
              <SheetDescription>
                {isEditing 
                  ? 'Modifica los datos de la operación' 
                  : 'Completa los datos para registrar una nueva operación'}
              </SheetDescription>
            </div>
          </div>
          
          {/* Type Selector - Pills */}
          {!isEditing && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tipo de operación
              </p>
              <div className="flex flex-wrap gap-2">
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
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="method">Método de Pago</Label>
                  <Select 
                    value={method} 
                    onValueChange={(v) => setMethod(v as TransactionMethod)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="method" className="w-full">
                      <SelectValue>
                        <span className="block truncate" title={methodLabel}>
                          {methodLabel || 'Seleccione método'}
                        </span>
                      </SelectValue>
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scope">Ámbito</Label>
                  <Select
                    value={operationScope}
                    onValueChange={(value) => {
                      const scope = (value as 'general' | 'project') ?? 'general'
                      setOperationScope(scope)
                      if (scope === 'general') setProjectId('')
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="scope" className="w-full">
                      <SelectValue>
                        <span className="block truncate">
                          {operationScope === 'general' ? 'General empresa' : 'Proyecto/Subproyecto'}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General empresa</SelectItem>
                      <SelectItem value="project">Proyecto/Subproyecto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fundOwner">Origen de fondos</Label>
                  <Select
                    value={fundOwner}
                    onValueChange={(value) => setFundOwner((value as 'company' | 'client_advance') ?? 'company')}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="fundOwner" className="w-full">
                      <SelectValue>
                        <span className="block truncate">
                          {fundOwner === 'company' ? 'Fondos empresa' : 'Anticipo cliente'}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Fondos empresa</SelectItem>
                      <SelectItem value="client_advance">Anticipo cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {operationScope === 'project' && (
                <div className="space-y-2">
                  <Label htmlFor="project">Proyecto / Subproyecto</Label>
                  <Select
                    value={projectId}
                    onValueChange={(value) => setProjectId(value ?? '')}
                    disabled={isLoading || isLoadingData}
                  >
                    <SelectTrigger id="project" className="w-full">
                      <SelectValue>
                        <span className="block truncate" title={projectLabel}>
                          {projectLabel || 'Seleccione proyecto'}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {flatProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            {/* Section: Accounts */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Wallet className="h-4 w-4" />
                <span>Cuentas</span>
                {isLoadingData && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </div>

              {!isDemoMode && !isLoadingData && accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 px-4 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 text-center space-y-3">
                  <Wallet className="h-10 w-10 text-muted-foreground/40" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">No tienes cuentas registradas</p>
                    <p className="text-xs text-muted-foreground">Crea una cuenta en Configuración para poder registrar operaciones.</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={handleClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#7B68EE] text-white hover:bg-[#7B68EE]/90 transition-colors"
                  >
                    Ir a Configuración
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : type === 'transfer' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sourceAccount">Cuenta Origen</Label>
                    <Select
                      value={sourceAccountId}
                      onValueChange={(v) => setSourceAccountId(v ?? '')}
                      disabled={isLoading || isLoadingData}
                    >
                      <SelectTrigger id="sourceAccount" className="w-full">
                        <SelectValue>
                          <span className="block truncate" title={sourceAccountLabel}>
                            {sourceAccountLabel || (isLoadingData ? 'Cargando...' : 'Seleccione cuenta')}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} ({account.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destAccount">Cuenta Destino</Label>
                    <Select
                      value={destinationAccountId}
                      onValueChange={(v) => setDestinationAccountId(v ?? '')}
                      disabled={isLoading || isLoadingData}
                    >
                      <SelectTrigger id="destAccount" className="w-full">
                        <SelectValue>
                          <span className="block truncate" title={destAccountLabel}>
                            {destAccountLabel || (isLoadingData ? 'Cargando...' : 'Seleccione cuenta')}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} ({account.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="account">
                    {type === 'adjustment' ? 'Cuenta a Ajustar' : 'Cuenta'}
                  </Label>
                  <Select
                    value={accountId}
                    onValueChange={(v) => setAccountId(v ?? '')}
                    disabled={isLoading || isLoadingData}
                  >
                    <SelectTrigger id="account" className="w-full">
                      <SelectValue>
                        <span className="block truncate" title={accountLabel}>
                          {accountLabel || (isLoadingData ? 'Cargando...' : 'Seleccione cuenta')}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    {isLoadingData && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    {(!isLoadingData && filteredCategories.length === 0) ? (
                      <div className="flex flex-col items-center justify-center py-6 px-4 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 text-center space-y-3">
                        <Tag className="h-10 w-10 text-muted-foreground/40" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">No hay categorías disponibles</p>
                          <p className="text-xs text-muted-foreground">
                            Crea categorías en Configuración para registrar {type === 'income' ? 'ingresos' : 'egresos'}.
                          </p>
                        </div>
                        <Link
                          href="/settings"
                          onClick={handleClose}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#7B68EE] text-white hover:bg-[#7B68EE]/90 transition-colors"
                        >
                          Ir a Configuración
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    ) : (
                      <Select
                        value={categoryId}
                        onValueChange={(v) => setCategoryId(v ?? '')}
                        disabled={isLoading || isLoadingData}
                      >
                        <SelectTrigger id="category" className="w-full">
                          <SelectValue>
                            <span className="block truncate" title={categoryLabel}>
                              {categoryLabel || (isLoadingData ? 'Cargando...' : 'Seleccione categoría')}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          <span className="block truncate" title={adjustmentReasonLabel}>
                            {adjustmentReasonLabel || 'Seleccione motivo'}
                          </span>
                        </SelectValue>
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
                    onValueChange={(value) => setCurrency(value ?? 'ARS')}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue>
                        {(() => {
                          const c = currencies.find(cur => cur.value === currency)
                          return c ? (
                            <span className="block truncate">{c.flag} {c.value}</span>
                          ) : (
                            <span className="block truncate">{currency}</span>
                          )
                        })()}
                      </SelectValue>
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
                  placeholder="Describe la operación..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="border-t bg-muted/50 px-6 py-4 shrink-0 flex-col-reverse gap-2 md:grid md:grid-cols-3 md:items-center md:gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isLoading}
            className="w-full"
          >
            Cancelar
          </Button>
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={() => handleSubmit(true)}
              disabled={isLoading || (!isDemoMode && accounts.length === 0)}
              className="w-full"
            >
              Guardar Borrador
            </Button>
          )}
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isLoading || (!isDemoMode && accounts.length === 0)}
            className="bg-[#7B68EE] hover:bg-[#7B68EE]/90 w-full"
          >
            {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Enviar Aprobación'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
