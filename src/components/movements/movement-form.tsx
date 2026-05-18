'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { Wallet } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_TYPES } from '@/lib/constants'
import { getAccounts } from '@/lib/actions/accounts'
import { getCategories } from '@/lib/actions/categories'
import { getProjects } from '@/lib/actions/projects'
import type { Account } from '@/lib/actions/accounts'
import type { Category } from '@/lib/actions/categories'
import type { Project } from '@/lib/actions/projects'
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
  movementHasCustomComponentBreakdown,
  resolveMovementDescription,
} from '@/lib/movements/form-defaults'
import {
  MOVEMENT_FORM_COPY,
  MOVEMENT_TYPE_OPTIONS,
} from '@/components/movements/movement-form.constants'
import {
  type ComponentLineDraft,
  componentsSumMatchesTotal,
  newComponentLine,
} from '@/components/movements/movement-form.types'
import { MovementGuidedFields } from '@/components/movements/movement-guided-fields'
import { MovementFormFooter } from '@/components/movements/movement-form-footer'
import { MovementFormFullFields } from '@/components/movements/movement-form-full-fields'
import { MovementQuickContactDialog } from '@/components/movements/movement-quick-contact-dialog'
import { flattenProjects } from '@/lib/movements/flatten-projects'
import { useAuthStore } from '@/stores/auth-store'
import { isAdminRole } from '@/lib/constants'

interface MovementFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateMovementInput, asDraft: boolean, submitForReviewOnly?: boolean) => void
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

  const role = useAuthStore((state) => state.role)
  const isAdmin = isAdminRole(role)
  const isEditing = !!movement
  const isRejectedCorrection = movement?.status === 'rejected'
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
  }, [])

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
        setMethod((movement.method as MovementMethod) || 'cash')
        setFundOwner((movement.fundOwner ?? 'company') as 'company' | 'client_advance')
        setProjectId(movement.projectId ?? '')
        setMovementScope(movement.projectId ? 'project' : 'general')
      } else {
        resetForm(fixedType ?? 'income')
      }
    })
  }, [movement, isOpen, resetForm, fixedType])

  useEffect(() => {
    if (!isOpen || !movement) return
    let cancelled = false
    ;(async () => {
      const res = await getMovementComponents(movement.id)
      if (cancelled) return
      const rows = res.success && res.data?.length ? res.data : []
      const custom = movementHasCustomComponentBreakdown(
        rows,
        movement.accountId,
        movement.amount
      )
      setShowAdvanced(custom)
      if (custom && rows.length > 0) {
        setComponentLines(
          rows.map((c) =>
            newComponentLine({
              localId: (c.id as string | undefined) ?? crypto.randomUUID(),
              componentType: c.componentType,
              accountId: c.accountId ?? '',
              contactId: c.contactId ?? '',
              amount: String(c.amount),
            })
          )
        )
      } else {
        setComponentLines([newComponentLine()])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, movement])

  const usesOptionalComponentBreakdown =
    type === 'income' || type === 'expense'

  const effectiveComponentLines = useMemo((): ComponentLineDraft[] => {
    if (
      showAdvanced ||
      !usesOptionalComponentBreakdown
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
  }, [showAdvanced, usesOptionalComponentBreakdown, accountId, amount, accounts, componentLines])

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

  const handleSubmit = (asDraft: boolean, submitForReviewOnly = false) => {
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

    onSubmit(data, asDraft, submitForReviewOnly)
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
                {isRejectedCorrection
                  ? 'Corregir movimiento rechazado'
                  : isEditing
                    ? 'Editar movimiento'
                    : formCopy?.title ?? 'Nuevo movimiento'}
              </SheetTitle>
              {!isGuidedCreate ? (
                <SheetDescription>
                  {isRejectedCorrection
                    ? 'Ajustá los datos y reenviá a aprobación'
                    : isEditing
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
                onNavigateToConfig={handleClose}
                onQuickContact={openQuickContact}
              />
            ) : (
              <MovementFormFullFields
                showComponentBreakdown={usesOptionalComponentBreakdown ? showAdvanced : undefined}
                onToggleComponentBreakdown={
                  usesOptionalComponentBreakdown
                    ? () => setShowAdvanced((v) => !v)
                    : undefined
                }
                type={type}
                date={date}
                onDateChange={setDate}
                method={method}
                onMethodChange={setMethod}
                movementScope={movementScope}
                onMovementScopeChange={setMovementScope}
                fundOwner={fundOwner}
                onFundOwnerChange={setFundOwner}
                projectId={projectId}
                onProjectIdChange={setProjectId}
                flatProjects={flatProjects}
                projectLabel={projectLabel}
                accounts={accounts}
                isLoading={isLoading}
                isLoadingData={isLoadingData}
                sourceAccountId={sourceAccountId}
                onSourceAccountIdChange={setSourceAccountId}
                destinationAccountId={destinationAccountId}
                onDestinationAccountIdChange={setDestinationAccountId}
                accountId={accountId}
                onAccountIdChange={setAccountId}
                sourceAccountLabel={sourceAccountLabel}
                destAccountLabel={destAccountLabel}
                accountLabel={accountLabel}
                filteredCategories={filteredCategories}
                categoryId={categoryId}
                onCategoryIdChange={setCategoryId}
                categoryLabel={categoryLabel}
                adjustmentReason={adjustmentReason}
                onAdjustmentReasonChange={setAdjustmentReason}
                adjustmentReasonLabel={adjustmentReasonLabel}
                amount={amount}
                onAmountChange={setAmount}
                currency={currency}
                onCurrencyChange={setCurrency}
                componentLines={componentLines}
                onComponentLinesChange={setComponentLines}
                filteredContacts={filteredContacts}
                description={description}
                onDescriptionChange={setDescription}
                onClose={handleClose}
                onQuickContact={openQuickContact}
              />
            )}

          </div>
        </div>

        <MovementFormFooter
          isGuidedCreate={isGuidedCreate}
          isLoading={Boolean(isLoading)}
          isEditing={isEditing}
          isRejectedCorrection={isRejectedCorrection}
          isAdmin={isAdmin}
          accountsEmpty={accounts.length === 0}
          type={type}
          accountId={accountId}
          categoryId={categoryId}
          sumMatchesComponents={sumMatchesComponents}
          submitLabel={formCopy?.submitLabel}
          onClose={handleClose}
          onSubmit={handleSubmit}
        />
      </SheetContent>
    </Sheet>

    <MovementQuickContactDialog
      open={quickContactOpen}
      onOpenChange={setQuickContactOpen}
      name={quickContactName}
      onNameChange={setQuickContactName}
      clientSegment={quickClientSegment}
      onClientSegmentChange={setQuickClientSegment}
      services={quickServices}
      onServicesChange={setQuickServices}
      saving={quickSaving}
      onSave={() => void saveQuickContact()}
    />
    </>
  )
}
