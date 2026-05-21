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
import {
  filterContactsForExpenseOperations,
  filterContactsForIncomeOperations,
} from '@/lib/contacts/contact-filters'
import type {
  CreateMovementInput,
  MovementType,
  MovementMethod,
  OperationKind,
} from '@/lib/validations/movement'
import {
  isCollectionOrPaymentKind,
  operationKindToMovementType,
} from '@/lib/movements/operation-kind'
import { todayCalendarDate } from '@/lib/movements/cash-date-policy'
import {
  buildCashDateContext,
  clampDateToBounds,
} from '@/lib/movements/cash-date-context'
import { toast } from 'sonner'
import { movementHasCustomComponentBreakdown } from '@/lib/movements/form-defaults'
import {
  MOVEMENT_FORM_COPY,
  MOVEMENT_TYPE_OPTIONS,
  OPERATION_KIND_FORM_COPY,
} from '@/components/movements/movement-form.constants'
import {
  buildEffectiveComponentLines,
  validateAndBuildMovementPayload,
} from '@/components/movements/movement-form-submit'
import {
  GUIDED_MAIN_CONTACT_LINE_ID,
  type ComponentLineDraft,
  componentsSumMatchesTotal,
  newComponentLine,
} from '@/components/movements/movement-form.types'
import { MovementGuidedFields } from '@/components/movements/movement-guided-fields'
import { MovementFormFooter } from '@/components/movements/movement-form-footer'
import { MovementFormFullFields } from '@/components/movements/movement-form-full-fields'
import { MovementQuickContactDialog } from '@/components/movements/movement-quick-contact-dialog'
import { flattenProjects } from '@/lib/movements/flatten-projects'
interface MovementFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateMovementInput, asDraft: boolean) => void
  movement?: Movement | null
  isLoading?: boolean
  /** Al crear: fija el tipo y oculta el selector (ingreso/egreso/transferencia/ajuste). */
  fixedType?: MovementType | null
  /** Al crear operación guiada: venta, compra, cobro o pago. */
  fixedOperationKind?: OperationKind | null
}

export function MovementForm({
  isOpen,
  onClose,
  onSubmit,
  movement,
  isLoading,
  fixedType = null,
  fixedOperationKind = null,
}: MovementFormProps) {
  const [showScopeOptions, setShowScopeOptions] = useState(false)
  const [showPaymentSplit, setShowPaymentSplit] = useState(false)
  const [type, setType] = useState<MovementType>(
    fixedOperationKind ? operationKindToMovementType(fixedOperationKind) : fixedType ?? 'income'
  )
  const [operationKind, setOperationKind] = useState<OperationKind>(
    fixedOperationKind ?? 'sale'
  )
  const [contactId, setContactId] = useState('')
  const [date, setDate] = useState<string>(todayCalendarDate())
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
  const [quickContactPhone, setQuickContactPhone] = useState('')
  const [quickContactEmail, setQuickContactEmail] = useState('')
  const [quickSaving, setQuickSaving] = useState(false)

  const isEditing = !!movement
  const isRejectedCorrection = movement?.status === 'rejected'
  const selectedType = MOVEMENT_TYPE_OPTIONS.find((t) => t.value === type)
  const isGuidedCreate =
    !isEditing &&
    (!!fixedOperationKind ||
      (!!fixedType && (fixedType === 'income' || fixedType === 'expense')))
  const formCopy = fixedOperationKind
    ? OPERATION_KIND_FORM_COPY[fixedOperationKind]
    : fixedType
      ? MOVEMENT_FORM_COPY[fixedType]
      : null

  const resetForm = useCallback(
    (nextType: MovementType = 'income', nextKind?: OperationKind) => {
    const kind =
      nextKind ??
      (nextType === 'income' ? 'sale' : nextType === 'expense' ? 'purchase' : 'sale')
    setType(nextType)
    setOperationKind(kind)
    setContactId('')
    setDate(todayCalendarDate())
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
    setShowScopeOptions(false)
    setShowPaymentSplit(false)
  },
  []
  )

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
    if (!isOpen || movement) return
    if (!fixedOperationKind && !fixedType) return
    queueMicrotask(() => {
      if (fixedOperationKind) {
        setOperationKind(fixedOperationKind)
        setType(operationKindToMovementType(fixedOperationKind))
      } else if (fixedType) {
        setType(fixedType)
        setOperationKind(fixedType === 'income' ? 'sale' : 'purchase')
      }
      setShowScopeOptions(false)
      setShowPaymentSplit(false)
    })
  }, [isOpen, fixedType, fixedOperationKind, movement])

  // Sync form when the movement being edited changes
  useEffect(() => {
    if (!isOpen) return
    queueMicrotask(() => {
      if (movement) {
        setType(movement.type)
        setOperationKind(
          movement.operationKind ??
            (movement.type === 'income' ? 'sale' : movement.type === 'expense' ? 'purchase' : 'sale')
        )
        setContactId(movement.contactId ?? '')
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
        resetForm(
          fixedOperationKind
            ? operationKindToMovementType(fixedOperationKind)
            : fixedType ?? 'income',
          fixedOperationKind ?? undefined
        )
      }
    })
  }, [movement, isOpen, resetForm, fixedType, fixedOperationKind])

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
      setShowScopeOptions(
        Boolean(movement.projectId) || movement.fundOwner === 'client_advance'
      )
      setShowPaymentSplit(custom)
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

  const effectiveComponentLines = useMemo(
    (): ComponentLineDraft[] =>
      buildEffectiveComponentLines({
        type,
        showPaymentSplit,
        componentLines,
        accountId,
        amount,
        accounts,
      }),
    [type, showPaymentSplit, componentLines, accountId, amount, accounts]
  )

  const cashDateContext = useMemo(() => {
    if (type !== 'income' && type !== 'expense') return null
    return buildCashDateContext({
      movementScope,
      showPaymentSplit,
      componentLines: effectiveComponentLines,
      accountId,
      accounts,
      date,
    })
  }, [type, movementScope, showPaymentSplit, effectiveComponentLines, accountId, accounts, date])

  const cashDateBounds = cashDateContext?.bounds ?? null

  function clampDateIfNeeded(nextBounds: { min: string; max: string } | null) {
    if (!nextBounds) return
    const next = clampDateToBounds(date, nextBounds)
    if (next !== date) setDate(next)
  }

  function togglePaymentSplit() {
    setPaymentMode(!showPaymentSplit)
  }

  function setPaymentMode(split: boolean) {
    if (split === showPaymentSplit) return
    if (split) {
      setAccountId('')
      setComponentLines([newComponentLine({ amount })])
      setShowPaymentSplit(true)
      queueMicrotask(() => clampDateIfNeeded(cashDateBounds))
      return
    }
    setShowPaymentSplit(false)
    setComponentLines([newComponentLine()])
    queueMicrotask(() => clampDateIfNeeded(cashDateBounds))
  }

  function handleMovementScopeChange(scope: 'general' | 'project') {
    setMovementScope(scope)
    if (scope === 'general') {
      const ctx = buildCashDateContext({
        movementScope: 'general',
        showPaymentSplit,
        componentLines: effectiveComponentLines,
        accountId,
        accounts,
        date,
      })
      clampDateIfNeeded(ctx.bounds)
    }
  }

  function handleAccountIdChange(value: string) {
    setAccountId(value)
    if (movementScope === 'general' && !showPaymentSplit) {
      const ctx = buildCashDateContext({
        movementScope: 'general',
        showPaymentSplit: false,
        componentLines: effectiveComponentLines,
        accountId: value,
        accounts,
        date,
      })
      clampDateIfNeeded(ctx.bounds)
    }
  }

  const handleSubmit = (asDraft: boolean) => {
    const result = validateAndBuildMovementPayload({
      type,
      operationKind,
      movementScope,
      date,
      amount,
      currency,
      description,
      method,
      accountId,
      categoryId,
      contactId,
      sourceAccountId,
      destinationAccountId,
      adjustmentReason,
      fundOwner,
      projectId,
      showPaymentSplit,
      componentLines,
      effectiveComponentLines,
      accounts,
      categories,
      contacts,
      cashDateContext,
    })

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    onSubmit(result.data, asDraft)
    if (!isEditing) {
      resetForm(
        fixedOperationKind
          ? operationKindToMovementType(fixedOperationKind)
          : fixedType ?? 'income',
        fixedOperationKind ?? undefined
      )
    }
  }

  const handleClose = () => {
    resetForm(
      fixedOperationKind
        ? operationKindToMovementType(fixedOperationKind)
        : fixedType ?? 'income',
      fixedOperationKind ?? undefined
    )
    setShowScopeOptions(false)
    setShowPaymentSplit(false)
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
  const contactLabel = contactId
    ? (contacts.find((c) => c.id === contactId)?.name ?? '')
    : ''
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
      ? filterContactsForIncomeOperations(contacts)
      : filterContactsForExpenseOperations(contacts)

  const sumMatchesComponents =
    type !== 'income' && type !== 'expense'
      ? true
      : !showPaymentSplit || componentsSumMatchesTotal(componentLines, amount)

  function defaultQuickContactKind(): 'client' | 'provider' {
    if (operationKind === 'payment' || type === 'expense') return 'provider'
    return 'client'
  }

  function openQuickContact(lineLocalId: string) {
    setQuickContactLineId(lineLocalId)
    setQuickContactName('')
    setQuickContactPhone('')
    setQuickContactEmail('')
    setQuickContactOpen(true)
  }

  async function saveQuickContact() {
    const trimmed = quickContactName.trim()
    const trimmedPhone = quickContactPhone.trim()
    if (!trimmed) {
      toast.error('Escribe el nombre del contacto')
      return
    }
    if (!trimmedPhone) {
      toast.error('Escribe el teléfono')
      return
    }
    setQuickSaving(true)
    try {
      const res = await createContact({
        name: trimmed,
        phone: trimmedPhone,
        email: quickContactEmail.trim(),
        kind: defaultQuickContactKind(),
      })
      if (!res.success || !res.data) {
        toast.error(res.error ?? 'No se pudo crear el contacto')
        return
      }
      setContacts((prev) => [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name)))
      if (quickContactLineId === GUIDED_MAIN_CONTACT_LINE_ID) {
        setContactId(res.data!.id)
      } else if (quickContactLineId) {
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
                    ? 'Ajusta los datos y reenvía a aprobación'
                    : isEditing
                      ? 'Modifica los datos del movimiento'
                      : formCopy?.subtitle ?? 'Completa los datos para registrar un movimiento'}
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
                operationKind={operationKind}
                amount={amount}
                onAmountChange={setAmount}
                currency={currency}
                onCurrencyChange={setCurrency}
                date={date}
                onDateChange={setDate}
                accountId={accountId}
                onAccountIdChange={handleAccountIdChange}
                categoryId={categoryId}
                onCategoryIdChange={setCategoryId}
                contactId={contactId}
                onContactIdChange={setContactId}
                description={description}
                onDescriptionChange={setDescription}
                movementScope={movementScope}
                onMovementScopeChange={handleMovementScopeChange}
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
                contactLabel={contactLabel}
                projectLabel={projectLabel}
                showScopeOptions={showScopeOptions}
                onToggleScopeOptions={() => setShowScopeOptions((v) => !v)}
                showPaymentSplit={showPaymentSplit}
                onPaymentModeChange={setPaymentMode}
                isLoading={isLoading}
                isLoadingData={isLoadingData}
                onNavigateToConfig={handleClose}
                onQuickContact={openQuickContact}
              />
            ) : (
              <MovementFormFullFields
                showComponentBreakdown={
                  usesOptionalComponentBreakdown ? showPaymentSplit : undefined
                }
                onToggleComponentBreakdown={
                  usesOptionalComponentBreakdown ? togglePaymentSplit : undefined
                }
                type={type}
                date={date}
                onDateChange={setDate}
                dateMin={cashDateBounds?.min}
                dateMax={cashDateBounds?.max}
                method={method}
                onMethodChange={setMethod}
                movementScope={movementScope}
                onMovementScopeChange={handleMovementScopeChange}
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
                onAccountIdChange={handleAccountIdChange}
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
          accountsEmpty={accounts.length === 0}
          type={type}
          operationKind={operationKind}
          accountId={accountId}
          categoryId={categoryId}
          contactId={contactId}
          sumMatchesComponents={sumMatchesComponents}
          primarySubmitLabel={formCopy?.submitLabel}
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
      phone={quickContactPhone}
      onPhoneChange={setQuickContactPhone}
      email={quickContactEmail}
      onEmailChange={setQuickContactEmail}
      contactKindLabel={
        isCollectionOrPaymentKind(operationKind)
          ? operationKind === 'collection'
            ? 'cliente'
            : 'proveedor'
          : type === 'income'
            ? 'cliente'
            : type === 'expense'
              ? 'proveedor'
              : 'contacto'
      }
      saving={quickSaving}
      onSave={() => void saveQuickContact()}
    />
    </>
  )
}
