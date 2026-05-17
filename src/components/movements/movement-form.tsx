'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { 
  Wallet, 
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
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
import type { Movement } from '@/lib/actions/movements'
import { getMovementComponents } from '@/lib/actions/movements'
import { getContacts, createContact, type ContactRow } from '@/lib/actions/contacts'
import type {
  CreateMovementInput,
  MovementType,
  MovementMethod,
  MovementComponentRow,
  AdjustmentReason,
} from '@/lib/validations/movement'
import { toast } from 'sonner'
import {
  defaultComponentTypeForAccount,
  resolveMovementDescription,
} from '@/lib/movements/form-defaults'
import {
  MOVEMENT_CURRENCIES,
  MOVEMENT_FORM_COPY,
  MOVEMENT_METHODS,
  MOVEMENT_TYPE_OPTIONS,
} from '@/components/movements/movement-form.constants'
import {
  type ComponentLineDraft,
  componentsSumMatchesTotal,
  newComponentLine,
} from '@/components/movements/movement-form.types'
import { MovementGuidedFields } from '@/components/movements/movement-guided-fields'
import { MovementComponentBreakdown } from '@/components/movements/movement-component-breakdown'
import { flattenProjects } from '@/lib/movements/flatten-projects'

interface MovementFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateMovementInput, asDraft: boolean) => void
  movement?: Movement | null
  isLoading?: boolean
  /** Al crear: fija el tipo y oculta el selector (ingreso/egreso/transferencia/ajuste). */
  fixedType?: MovementType | null
}

export function MovementForm({
  isOpen,
  onClose,
  onSubmit,
  movement,
  isLoading,
  fixedType = null,
}: MovementFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [type, setType] = useState<MovementType>('income')
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('ARS')
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState<MovementMethod>('cash')
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [destinationAccountId, setDestinationAccountId] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [fundOwner, setFundOwner] = useState<'company' | 'client_advance'>('company')
  const [movementScope, setMovementScope] = useState<'general' | 'project'>('general')
  const [projectId, setProjectId] = useState('')

  // Data from server
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [componentLines, setComponentLines] = useState<ComponentLineDraft[]>([newComponentLine()])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [quickContactOpen, setQuickContactOpen] = useState(false)
  const [quickContactLineId, setQuickContactLineId] = useState<string | null>(null)
  const [quickContactName, setQuickContactName] = useState('')
  const [quickClientSegment, setQuickClientSegment] = useState('')
  const [quickServices, setQuickServices] = useState('')
  const [quickSaving, setQuickSaving] = useState(false)

  const isDemoMode = useAuthStore((state) => state.isDemoMode)
  const isEditing = !!movement
  const selectedType = MOVEMENT_TYPE_OPTIONS.find((t) => t.value === type)
  const isGuidedCreate =
    !isEditing &&
    !!fixedType &&
    (fixedType === 'income' || fixedType === 'expense')
  const formCopy = fixedType ? MOVEMENT_FORM_COPY[fixedType] : null

  const resetForm = useCallback((nextType: MovementType = 'income') => {
    setType(nextType)
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
    setMovementScope('general')
    setComponentLines([newComponentLine()])
    setShowAdvanced(false)
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

  useEffect(() => {
    if (!isOpen || !fixedType || movement) return
    queueMicrotask(() => {
      setType(fixedType)
      if (fixedType === 'income' || fixedType === 'expense') {
        setShowAdvanced(false)
      }
    })
  }, [isOpen, fixedType, movement])

  // Sync form when the movement being edited changes
  useEffect(() => {
    if (!isOpen) return
    queueMicrotask(() => {
      if (movement) {
        setType(movement.type)
        setDate(format(new Date(movement.date), 'yyyy-MM-dd'))
        setAccountId(movement.accountId)
        setCategoryId(movement.categoryId || '')
        setAmount(movement.amount.toString())
        setCurrency(movement.currency)
        setDescription(movement.description)
        setMethod('cash')
        setFundOwner((movement.fundOwner ?? 'company') as 'company' | 'client_advance')
        setProjectId(movement.projectId ?? '')
        setMovementScope(movement.projectId ? 'project' : 'general')
      } else {
        resetForm(fixedType ?? 'income')
      }
    })
  }, [movement, isOpen, resetForm, fixedType])

  useEffect(() => {
    if (!isOpen || !movement || isDemoMode) return
    let cancelled = false
    ;(async () => {
      const res = await getMovementComponents(movement.id)
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
  }, [isOpen, movement, isDemoMode])

  const effectiveComponentLines = useMemo((): ComponentLineDraft[] => {
    if (
      showAdvanced ||
      isEditing ||
      (type !== 'income' && type !== 'expense')
    ) {
      return componentLines
    }
    const account = accounts.find((a) => a.id === accountId)
    return [
      newComponentLine({
        componentType: defaultComponentTypeForAccount(account?.type),
        accountId,
        amount,
      }),
    ]
  }, [showAdvanced, isEditing, type, accountId, amount, accounts, componentLines])

  const buildMovementComponents = (): MovementComponentRow[] => {
    const total = parseFloat(amount)
    const rows: MovementComponentRow[] = []
    for (const line of effectiveComponentLines) {
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
      toast.error('Indicá un monto mayor a cero')
      return
    }

    if (type === 'income' || type === 'expense') {
      if (!accountId) {
        toast.error('Elegí la cuenta')
        return
      }
      if (!categoryId) {
        toast.error('Elegí una categoría')
        return
      }
    }

    const categoryName = categories.find((c) => c.id === categoryId)?.name
    const finalDescription = resolveMovementDescription({
      type,
      description,
      categoryName,
    })

    if (type !== 'transfer' && finalDescription.trim().length < 3) {
      toast.error('Escribí una nota de al menos 3 caracteres o elegí una categoría')
      return
    }

    let movementComponents: MovementComponentRow[] | undefined
    if (type === 'income' || type === 'expense') {
      const built = buildMovementComponents()
      if (!built.length) {
        toast.error('Revisá el monto y la cuenta: el desglose debe coincidir con el total')
        return
      }
      movementComponents = built
    }

    const data: CreateMovementInput = {
      type,
      date: new Date(date),
      amount: parsedAmount,
      currency,
      description: finalDescription,
      method,
      ...(type === 'income' || type === 'expense'
        ? { accountId, categoryId: categoryId || undefined, movementComponents }
        : {}),
      ...(type === 'transfer'
        ? { sourceAccountId, destinationAccountId }
        : {}),
      ...(type === 'adjustment'
        ? { accountId, adjustmentReason: adjustmentReason as AdjustmentReason }
        : {}),
      fundOwner,
      projectId: movementScope === 'project' ? projectId || undefined : undefined,
    }

    onSubmit(data, asDraft)
    if (!isEditing) {
      resetForm(fixedType ?? 'income')
    }
  }

  const handleClose = () => {
    resetForm(fixedType ?? 'income')
    setShowAdvanced(false)
    onClose()
  }

  // Filter categories by movement type
  const filteredCategories = categories.filter((c) => {
    if (type === 'income') return c.type === CATEGORY_TYPES.INCOME
    if (type === 'expense') return c.type === CATEGORY_TYPES.EXPENSE
    return false // No categories for transfer/adjustment
  })

  // Resolve display labels from current values (base-ui shows raw value, not label)
  const methodLabel = MOVEMENT_METHODS.find(m => m.value === method)?.label ?? ''
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
  const flatProjects = flattenProjects(projects)
  const projectLabel = projectId ? flatProjects.find((p) => p.id === projectId)?.name ?? '' : ''

  const filteredContacts =
    type === 'income'
      ? contacts.filter((c) => c.kind === 'client' || c.kind === 'both')
      : contacts.filter((c) => c.kind === 'provider' || c.kind === 'both')

  const sumMatchesComponents =
    type !== 'income' && type !== 'expense'
      ? true
      : componentsSumMatchesTotal(effectiveComponentLines, amount)

  function defaultQuickContactKind(): ContactRow['kind'] {
    if (type === 'income') return 'client'
    if (type === 'expense') return 'provider'
    return 'both'
  }

  function openQuickContact(lineLocalId: string) {
    setQuickContactLineId(lineLocalId)
    setQuickContactName('')
    setQuickClientSegment('')
    setQuickServices('')
    setQuickContactOpen(true)
  }

  async function saveQuickContact() {
    const trimmed = quickContactName.trim()
    if (!trimmed) {
      toast.error('Escribí el nombre del contacto')
      return
    }
    setQuickSaving(true)
    try {
      const res = await createContact({
        name: trimmed,
        kind: defaultQuickContactKind(),
        clientSegment: quickClientSegment.trim() || null,
        associatedServices: quickServices.trim() || null,
      })
      if (!res.success || !res.data) {
        toast.error(res.error ?? 'No se pudo crear el contacto')
        return
      }
      setContacts((prev) => [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name)))
      if (quickContactLineId) {
        setComponentLines((prev) =>
          prev.map((l) => (l.localId === quickContactLineId ? { ...l, contactId: res.data!.id } : l))
        )
      }
      toast.success('Contacto creado')
      setQuickContactOpen(false)
    } finally {
      setQuickSaving(false)
    }
  }

  return (
    <>
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-md data-[side=right]:lg:max-w-lg p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader
          className={
            isGuidedCreate
              ? 'shrink-0 space-y-0 border-b px-4 py-3'
              : 'space-y-3 border-b px-6 py-4'
          }
        >
          <div className="flex items-center gap-2.5 pr-8">
            <div className={`shrink-0 rounded-md p-1.5 ${selectedType?.color || ''}`}>
              <TypeIcon className={isGuidedCreate ? 'h-4 w-4' : 'h-5 w-5'} />
            </div>
            <div className="min-w-0">
              <SheetTitle className={isGuidedCreate ? 'text-base leading-tight' : 'text-lg'}>
                {isEditing
                  ? 'Editar movimiento'
                  : formCopy?.title ?? 'Nuevo movimiento'}
              </SheetTitle>
              {!isGuidedCreate ? (
                <SheetDescription>
                  {isEditing
                    ? 'Modificá los datos del movimiento'
                    : formCopy?.subtitle ?? 'Completá los datos para registrar un movimiento'}
                </SheetDescription>
              ) : null}
            </div>
          </div>

          {/* Type Selector - Pills */}
          {!isEditing && !fixedType && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tipo de movimiento
              </p>
              <div className="flex flex-wrap gap-2">
                {MOVEMENT_TYPE_OPTIONS.map((t) => {
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
        <div
          className={
            isGuidedCreate
              ? 'flex-1 overflow-y-auto px-4 py-3'
              : 'flex-1 overflow-y-auto px-6 py-4'
          }
        >
          <div className={isGuidedCreate ? 'space-y-3' : 'space-y-6'}>
            {isGuidedCreate ? (
              <MovementGuidedFields
                type={type as 'income' | 'expense'}
                amount={amount}
                onAmountChange={setAmount}
                currency={currency}
                onCurrencyChange={setCurrency}
                date={date}
                onDateChange={setDate}
                accountId={accountId}
                onAccountIdChange={setAccountId}
                categoryId={categoryId}
                onCategoryIdChange={setCategoryId}
                description={description}
                onDescriptionChange={setDescription}
                movementScope={movementScope}
                onMovementScopeChange={setMovementScope}
                fundOwner={fundOwner}
                onFundOwnerChange={setFundOwner}
                projectId={projectId}
                onProjectIdChange={setProjectId}
                componentLines={componentLines}
                onComponentLinesChange={setComponentLines}
                accounts={accounts}
                categories={filteredCategories}
                filteredContacts={filteredContacts}
                flatProjects={flatProjects}
                accountLabel={accountLabel}
                categoryLabel={categoryLabel}
                projectLabel={projectLabel}
                showAdvanced={showAdvanced}
                onToggleAdvanced={() => setShowAdvanced((v) => !v)}
                isLoading={isLoading}
                isLoadingData={isLoadingData}
                isDemoMode={isDemoMode}
                onNavigateToConfig={handleClose}
                onQuickContact={openQuickContact}
              />
            ) : (
              <>
            {/* Formulario completo (transferencia, ajuste, edición) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Información General</span>
              </div>
              
              <div className={`grid grid-cols-1 gap-4 ${type === 'income' || type === 'expense' ? '' : 'sm:grid-cols-2'}`}>
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
                {(type === 'transfer' || type === 'adjustment') && (
                  <div className="space-y-2">
                    <Label htmlFor="method">Método del movimiento</Label>
                    <Select 
                      value={method} 
                      onValueChange={(v) => setMethod(v as MovementMethod)}
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
                        {MOVEMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scope">Ámbito</Label>
                  <Select
                    value={movementScope}
                    onValueChange={(value) => {
                      const scope = (value as 'general' | 'project') ?? 'general'
                      setMovementScope(scope)
                      if (scope === 'general') setProjectId('')
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="scope" className="w-full">
                      <SelectValue>
                        <span className="block truncate">
                          {movementScope === 'general' ? 'General empresa' : 'Proyecto/Subproyecto'}
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

              {movementScope === 'project' && (
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
                    <p className="text-xs text-muted-foreground">Creá una cuenta en Mis cuentas para poder registrar movimientos.</p>
                  </div>
                  <Link
                    href="/cuentas"
                    onClick={handleClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#7B68EE] text-white hover:bg-[#7B68EE]/90 transition-colors"
                  >
                    Ir a Mis cuentas
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
                            Creá categorías para registrar {type === 'income' ? 'ingresos' : 'egresos'}.
                          </p>
                        </div>
                        <Link
                          href="/categorias"
                          onClick={handleClose}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#7B68EE] text-white hover:bg-[#7B68EE]/90 transition-colors"
                        >
                          Ir a Categorías
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
                  <MoneyInput
                    id="amount"
                    value={amount}
                    onValueChange={setAmount}
                    currency={currency}
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
                          const c = MOVEMENT_CURRENCIES.find(cur => cur.value === currency)
                          return c ? (
                            <span className="block truncate">{c.flag} {c.value}</span>
                          ) : (
                            <span className="block truncate">{currency}</span>
                          )
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {MOVEMENT_CURRENCIES.map((c) => (
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
                <MovementComponentBreakdown
                  movementType={type as 'income' | 'expense'}
                  componentLines={componentLines}
                  onComponentLinesChange={setComponentLines}
                  accounts={accounts}
                  filteredContacts={filteredContacts}
                  currency={currency}
                  totalAmount={amount}
                  isLoading={isLoading}
                  isLoadingData={isLoadingData}
                  isDemoMode={isDemoMode}
                  onQuickContact={openQuickContact}
                />
              </>
            )}


            {/* Section: Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Descripción</span>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Describe el movimiento..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <SheetFooter
          className={
            isGuidedCreate
              ? 'shrink-0 flex-col-reverse gap-2 border-t bg-muted/50 px-4 py-3 sm:grid sm:grid-cols-3 sm:items-center sm:gap-2'
              : 'shrink-0 flex-col-reverse gap-2 border-t bg-muted/50 px-6 py-4 md:grid md:grid-cols-3 md:items-center md:gap-3'
          }
        >
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
              ((type === 'income' || type === 'expense') &&
                (!accountId || !categoryId || !sumMatchesComponents))
            }
            className="bg-[#7B68EE] hover:bg-[#7B68EE]/90 w-full"
          >
            {isLoading
              ? 'Guardando...'
              : isEditing
                ? 'Guardar cambios'
                : formCopy?.submitLabel ?? 'Enviar a aprobación'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <Dialog open={quickContactOpen} onOpenChange={setQuickContactOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo contacto</DialogTitle>
          <DialogDescription>
            Queda en tu empresa y seleccionado en esta línea. El tipo cliente/proveedor sigue el movimiento.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input
              value={quickContactName}
              onChange={(e) => setQuickContactName(e.target.value)}
              placeholder="Nombre o razón social"
            />
          </div>
          <div className="space-y-1">
            <Label>Segmento (opcional)</Label>
            <Input
              value={quickClientSegment}
              onChange={(e) => setQuickClientSegment(e.target.value)}
              placeholder="ej. particular, corporativo"
            />
          </div>
          <div className="space-y-1">
            <Label>Servicios asociados (opcional)</Label>
            <Input
              value={quickServices}
              onChange={(e) => setQuickServices(e.target.value)}
              placeholder="Texto libre"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setQuickContactOpen(false)} disabled={quickSaving}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void saveQuickContact()}
            disabled={quickSaving}
            className="bg-[#7B68EE] hover:bg-[#7B68EE]/90"
          >
            {quickSaving ? 'Guardando...' : 'Crear contacto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
