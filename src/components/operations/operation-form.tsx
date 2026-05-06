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
  Plus,
  Trash2,
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
import { CATEGORY_TYPES } from '@/lib/constants'
import { getAccounts } from '@/lib/actions/accounts'
import { getCategories } from '@/lib/actions/categories'
import { getProjects } from '@/lib/actions/projects'
import type { Account } from '@/lib/actions/accounts'
import type { Category } from '@/lib/actions/categories'
import type { Project } from '@/lib/actions/projects'
import { DEMO_ACCOUNTS, DEMO_CATEGORIES } from '@/lib/demo-data'
import { useAuthStore } from '@/stores/auth-store'
import type { Operation } from '@/lib/actions/operations'
import { getOperationComponents } from '@/lib/actions/operations'
import { getContacts } from '@/lib/actions/contacts'
import type {
  CreateOperationInput,
  OperationType,
  OperationMethod,
  OperationComponentType,
  OperationComponentRow,
  AdjustmentReason,
} from '@/lib/validations/operation'
import { toast } from 'sonner'

interface OperationFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateOperationInput, asDraft: boolean) => void
  operation?: Operation | null
  isLoading?: boolean
}

type ComponentLineDraft = {
  localId: string
  componentType: OperationComponentType
  accountId: string
  contactId: string
  amount: string
}

function newComponentLine(partial?: Partial<ComponentLineDraft>): ComponentLineDraft {
  return {
    localId: partial?.localId ?? crypto.randomUUID(),
    componentType: partial?.componentType ?? 'operative_cash',
    accountId: partial?.accountId ?? '',
    contactId: partial?.contactId ?? '',
    amount: partial?.amount ?? '',
  }
}

const operationTypeOptions: { value: OperationType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'income', label: 'Ingreso', icon: Wallet, color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'expense', label: 'Egreso', icon: CreditCard, color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'transfer', label: 'Transferencia', icon: ArrowRightLeft, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'adjustment', label: 'Ajuste', icon: Settings, color: 'bg-orange-100 text-orange-700 border-orange-200' },
]

const methods: { value: OperationMethod; label: string }[] = [
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

export function OperationForm({
  isOpen,
  onClose,
  onSubmit,
  operation,
  isLoading,
}: OperationFormProps) {
  const [type, setType] = useState<OperationType>('income')
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('ARS')
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState<OperationMethod>('cash')
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
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; kind: string }>>([])
  const [componentLines, setComponentLines] = useState<ComponentLineDraft[]>([newComponentLine()])
  const [isLoadingData, setIsLoadingData] = useState(false)

  const isDemoMode = useAuthStore((state) => state.isDemoMode)
  const isEditing = !!operation
  const selectedType = operationTypeOptions.find((t) => t.value === type)

  const resetForm = useCallback(() => {
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
    setComponentLines([newComponentLine()])
  }, [])

  // Fetch accounts and categories on open
  const loadFormData = useCallback(async () => {
    if (isDemoMode) {
      // Modo demo: usar datos locales
      setAccounts(DEMO_ACCOUNTS.map(a => ({ ...a })))
      setCategories(DEMO_CATEGORIES.map(c => ({ ...c })))
      setContacts([])
      return
    }

    setIsLoadingData(true)
    try {
      const [accountsResult, categoriesResult, projectsResult, contactsResult] = await Promise.all([
        getAccounts(),
        getCategories(),
        getProjects(),
        getContacts(),
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
      if (contactsResult.success && contactsResult.data) {
        setContacts(contactsResult.data)
      }
    } catch (error) {
      console.error('Error loading form data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    if (!isOpen) return
    queueMicrotask(() => {
      void loadFormData()
    })
  }, [isOpen, loadFormData])

  // Sincronizar formulario cuando cambia la operación en edición
  useEffect(() => {
    if (!isOpen) return
    queueMicrotask(() => {
      if (operation) {
        setType(operation.type)
        setDate(format(new Date(operation.date), 'yyyy-MM-dd'))
        setAccountId(operation.accountId)
        setCategoryId(operation.categoryId || '')
        setAmount(operation.amount.toString())
        setCurrency(operation.currency)
        setDescription(operation.description)
        setMethod('cash')
        setFundOwner((operation.fundOwner ?? 'company') as 'company' | 'client_advance')
        setProjectId(operation.projectId ?? '')
        setOperationScope(operation.projectId ? 'project' : 'general')
      } else {
        resetForm()
      }
    })
  }, [operation, isOpen, resetForm])

  useEffect(() => {
    if (!isOpen || !operation || isDemoMode) return
    let cancelled = false
    ;(async () => {
      const res = await getOperationComponents(operation.id)
      if (cancelled || !res.success || !res.data?.length) return
      setComponentLines(
        res.data.map((c) =>
          newComponentLine({
            localId: (c.id as string | undefined) ?? crypto.randomUUID(),
            componentType: c.componentType,
            accountId: c.accountId ?? '',
            contactId: c.contactId ?? '',
            amount: String(c.amount),
          })
        )
      )
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, operation, isDemoMode])

  const buildOperationComponents = (): OperationComponentRow[] => {
    const total = parseFloat(amount)
    const rows: OperationComponentRow[] = []
    for (const line of componentLines) {
      const amt = parseFloat(line.amount)
      if (!line.amount.trim() || Number.isNaN(amt) || amt <= 0) continue
      rows.push({
        componentType: line.componentType,
        accountId:
          line.componentType === 'operative_cash' || line.componentType === 'operative_bank'
            ? line.accountId
            : undefined,
        contactId:
          line.componentType === 'client_receivable' || line.componentType === 'supplier_payable'
            ? line.contactId
            : undefined,
        amount: amt,
        currency,
      })
    }
    const sum = rows.reduce((a, r) => a + r.amount, 0)
    if (rows.length === 0 || Math.round(sum * 100) !== Math.round(total * 100)) {
      return []
    }
    return rows
  }

  const handleSubmit = (asDraft: boolean) => {
    const parsedAmount = parseFloat(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Indica un monto válido')
      return
    }

    let operationComponents: OperationComponentRow[] | undefined
    if (type === 'income' || type === 'expense') {
      const built = buildOperationComponents()
      if (!asDraft) {
        if (!built.length) {
          toast.error('El desglose de medios de pago debe sumar exactamente el monto total')
          return
        }
        operationComponents = built
      } else if (built.length > 0) {
        operationComponents = built
      }
    }

    const data: CreateOperationInput = {
      type,
      date: new Date(date),
      amount: parsedAmount,
      currency,
      description,
      method,
      ...(type === 'income' || type === 'expense'
        ? { accountId, categoryId: categoryId || undefined, operationComponents }
        : {}),
      ...(type === 'transfer'
        ? { sourceAccountId, destinationAccountId }
        : {}),
      ...(type === 'adjustment'
        ? { accountId, adjustmentReason: adjustmentReason as AdjustmentReason }
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

  // Filtrar categorías según tipo de operación
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

  const incomeCompTypes: { value: OperationComponentType; label: string }[] = [
    { value: 'operative_cash', label: 'Efectivo (caja)' },
    { value: 'operative_bank', label: 'Banco / cuenta' },
    { value: 'client_receivable', label: 'Cliente (cuenta corriente)' },
  ]
  const expenseCompTypes: { value: OperationComponentType; label: string }[] = [
    { value: 'operative_cash', label: 'Efectivo (caja)' },
    { value: 'operative_bank', label: 'Banco / cuenta' },
    { value: 'supplier_payable', label: 'Proveedor (cuenta corriente)' },
  ]
  const activeCompTypes = type === 'income' ? incomeCompTypes : expenseCompTypes
  const filteredContacts =
    type === 'income'
      ? contacts.filter((c) => c.kind === 'client' || c.kind === 'both')
      : contacts.filter((c) => c.kind === 'provider' || c.kind === 'both')

  const componentsSum = componentLines.reduce((acc, line) => {
    const v = parseFloat(line.amount)
    return acc + (Number.isNaN(v) ? 0 : v)
  }, 0)
  const parsedTotalAmt = parseFloat(amount)
  const sumMatchesComponents =
    type !== 'income' && type !== 'expense'
      ? true
      : !Number.isNaN(parsedTotalAmt) &&
        Math.round(componentsSum * 100) === Math.round(parsedTotalAmt * 100)

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
                {operationTypeOptions.map((t) => {
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
                    onValueChange={(v) => setMethod(v as OperationMethod)}
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
                    href="/configuracion"
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
                          href="/configuracion"
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

            {(type === 'income' || type === 'expense') && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      <span>Medios de pago</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        setComponentLines((prev) => [...prev, newComponentLine()])
                      }
                      disabled={isLoading}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Agregar línea
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    La suma debe coincidir con el monto total ({currency}). Obligatorio al enviar a aprobación.
                  </p>
                  <div
                    className={`rounded-md border px-3 py-2 text-xs font-medium ${
                      sumMatchesComponents
                        ? 'border-green-200 bg-green-50 text-green-800'
                        : 'border-amber-200 bg-amber-50 text-amber-900'
                    }`}
                  >
                    Suma medios:{' '}
                    {Number.isNaN(componentsSum) ? '—' : componentsSum.toFixed(2)} {currency} · Total:{' '}
                    {Number.isNaN(parsedTotalAmt) ? '—' : parsedTotalAmt.toFixed(2)} {currency}
                  </div>

                  <div className="space-y-4">
                    {componentLines.map((line, idx) => (
                      <div
                        key={line.localId}
                        className="rounded-lg border border-muted p-3 space-y-3 bg-muted/20"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Línea {idx + 1}
                          </span>
                          {componentLines.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive"
                              onClick={() =>
                                setComponentLines((prev) =>
                                  prev.filter((l) => l.localId !== line.localId)
                                )
                              }
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select
                            value={line.componentType}
                            onValueChange={(v) =>
                              setComponentLines((prev) =>
                                prev.map((l) =>
                                  l.localId === line.localId
                                    ? {
                                        ...l,
                                        componentType: v as OperationComponentType,
                                        accountId:
                                          v === 'client_receivable' || v === 'supplier_payable'
                                            ? ''
                                            : l.accountId,
                                        contactId:
                                          v === 'operative_cash' || v === 'operative_bank'
                                            ? ''
                                            : l.contactId,
                                      }
                                    : l
                                )
                              )
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {activeCompTypes.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {line.componentType === 'operative_cash' ||
                        line.componentType === 'operative_bank' ? (
                          <div className="space-y-2">
                            <Label>Cuenta</Label>
                            <Select
                              value={line.accountId}
                              onValueChange={(v) =>
                                setComponentLines((prev) =>
                                  prev.map((l) =>
                                    l.localId === line.localId ? { ...l, accountId: v ?? '' } : l
                                  )
                                )
                              }
                              disabled={isLoading || isLoadingData}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccione cuenta" />
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
                        ) : (
                          <div className="space-y-2">
                            <Label>Contacto</Label>
                            <Select
                              value={line.contactId}
                              onValueChange={(v) =>
                                setComponentLines((prev) =>
                                  prev.map((l) =>
                                    l.localId === line.localId ? { ...l, contactId: v ?? '' } : l
                                  )
                                )
                              }
                              disabled={isLoading || isLoadingData}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={
                                  filteredContacts.length
                                    ? 'Seleccione contacto'
                                    : 'Sin contactos — créalos en Configuración'
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredContacts.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Monto línea</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.amount}
                            onChange={(e) =>
                              setComponentLines((prev) =>
                                prev.map((l) =>
                                  l.localId === line.localId
                                    ? { ...l, amount: e.target.value }
                                    : l
                                )
                              )
                            }
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

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
            disabled={
              isLoading ||
              (!isDemoMode && accounts.length === 0) ||
              ((type === 'income' || type === 'expense') && !sumMatchesComponents)
            }
            className="bg-[#7B68EE] hover:bg-[#7B68EE]/90 w-full"
          >
            {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Enviar Aprobación'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
