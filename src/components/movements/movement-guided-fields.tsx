'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormCreatableSelect, FormField, FormInput } from '@/components/ui/form-controls'
import { MovementFriendlyPaymentBreakdown } from '@/components/movements/movement-friendly-payment-breakdown'
import { MovementScopeFields } from '@/components/movements/movement-scope-fields'
import {
  MovementCategoryField,
  MovementDateField,
  MovementFormSection,
} from '@/components/movements/form-fields'
import { guidedDescriptionPlaceholder } from '@/components/movements/movement-form-guided-copy'
import {
  GUIDED_MAIN_CONTACT_LINE_ID,
  MOVEMENT_GUIDED_FIELD_IDS,
} from '@/components/movements/movement-form.types'
import { buildCashDateContext } from '@/lib/movements/cash-date-context'
import { OPERATION_CONTACT_HELP_COPY } from '@/lib/movements/movement-config'
import { isCollectionOrPaymentKind, isSaleOrPurchaseKind } from '@/lib/movements/operation-kind'
import type { Account } from '@/lib/actions/accounts'
import type { Category } from '@/lib/actions/categories'
import type { ContactRow } from '@/lib/actions/contacts'
import type { FlatProjectOption } from '@/lib/movements/flatten-projects'
import type { OperationKind } from '@/lib/validations/movement'
import type { ComponentLineDraft } from '@/components/movements/movement-form.types'
import { cn } from '@/lib/utils'
import { formSegmentButtonClass } from '@/components/ui/form-controls'

const scopeToggleClass = cn(formSegmentButtonClass(), 'w-full justify-between px-4 text-muted-foreground')

export type MovementGuidedFieldsProps = {
  type: 'income' | 'expense'
  operationKind: OperationKind
  amount: string
  onAmountChange: (value: string) => void
  currency: string
  date: string
  onDateChange: (value: string) => void
  accountId: string
  onAccountIdChange: (value: string) => void
  categoryId: string
  onCategoryIdChange: (value: string) => void
  contactId: string
  onContactIdChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  movementScope: 'general' | 'project'
  onMovementScopeChange: (scope: 'general' | 'project') => void
  fundOwner: 'company' | 'client_advance'
  onFundOwnerChange: (owner: 'company' | 'client_advance') => void
  projectId: string
  onProjectIdChange: (id: string) => void
  componentLines: ComponentLineDraft[]
  onComponentLinesChange: (
    updater: (prev: ComponentLineDraft[]) => ComponentLineDraft[]
  ) => void
  accounts: Account[]
  categories: Category[]
  filteredContacts: ContactRow[]
  flatProjects: FlatProjectOption[]
  accountLabel: string
  categoryLabel: string
  contactLabel: string
  projectLabel: string
  showScopeOptions: boolean
  onToggleScopeOptions: () => void
  showPaymentSplit: boolean
  onPaymentModeChange: (split: boolean) => void
  isLoading?: boolean
  isLoadingData?: boolean
  onNavigateToConfig: () => void
  onQuickContact: (lineLocalId: string) => void
}

export function MovementGuidedFields(props: MovementGuidedFieldsProps) {
  const {
    type,
    operationKind,
    currency,
    date,
    onDateChange,
    categoryId,
    onCategoryIdChange,
    contactId,
    onContactIdChange,
    description,
    onDescriptionChange,
    movementScope,
    onMovementScopeChange,
    fundOwner,
    onFundOwnerChange,
    projectId,
    onProjectIdChange,
    componentLines,
    onComponentLinesChange,
    accounts,
    categories,
    filteredContacts,
    flatProjects,
    categoryLabel,
    contactLabel,
    projectLabel,
    showScopeOptions,
    onToggleScopeOptions,
    isLoading,
    isLoadingData,
    onQuickContact,
  } = props

  void props.amount
  void props.onAmountChange
  void props.accountId
  void props.onAccountIdChange
  void props.accountLabel
  void props.showPaymentSplit
  void props.onPaymentModeChange

  const isCollectionPayment = isCollectionOrPaymentKind(operationKind)
  const isSalePurchase = isSaleOrPurchaseKind(operationKind)

  const { bounds: dateBounds } = buildCashDateContext({
    movementScope,
    showPaymentSplit: true,
    componentLines,
    accountId: '',
    accounts,
    date,
  })

  return (
    <div className="space-y-3">
      <MovementDateField
        date={date}
        onDateChange={onDateChange}
        min={dateBounds?.min}
        max={dateBounds?.max}
        showCashHint={Boolean(dateBounds)}
        disabled={isLoading}
      />

      {isCollectionPayment ? (
        <MovementFormSection
          heading={operationKind === 'collection' ? '¿De quién es el cobro?' : '¿A quién le pagaste?'}
        >
          <FormCreatableSelect
            label={operationKind === 'collection' ? 'Cliente' : 'Proveedor'}
            htmlFor={MOVEMENT_GUIDED_FIELD_IDS.contact}
            alignControl
            value={contactId}
            onValueChange={onContactIdChange}
            options={filteredContacts.map((contact) => ({
              value: contact.id,
              label: contact.name,
            }))}
            placeholder="Elegí contacto"
            selectedLabel={contactLabel}
            hint={OPERATION_CONTACT_HELP_COPY}
            disabled={isLoading}
            isLoading={isLoadingData}
            onCreateNew={() => onQuickContact(GUIDED_MAIN_CONTACT_LINE_ID)}
            createNewLabel="+ Nuevo"
            emptyCreateLabel={
              operationKind === 'collection' ? 'Crear cliente' : 'Crear proveedor'
            }
          />
        </MovementFormSection>
      ) : null}

      {isSalePurchase ? (
        <MovementCategoryField
          categoryId={categoryId}
          onCategoryIdChange={onCategoryIdChange}
          categories={categories}
          categoryLabel={categoryLabel}
          disabled={isLoading}
          isLoadingData={isLoadingData}
          onNavigateToSetup={props.onNavigateToConfig}
        />
      ) : null}

      <MovementFormSection>
        <MovementFriendlyPaymentBreakdown
          movementType={type}
          operationKind={operationKind}
          componentLines={componentLines}
          onComponentLinesChange={onComponentLinesChange}
          accounts={accounts}
          filteredContacts={filteredContacts}
          currency={currency}
          mainContactId={contactId}
          mainContactLabel={contactLabel}
          isLoading={isLoading}
          isLoadingData={isLoadingData}
          onQuickContact={onQuickContact}
        />
      </MovementFormSection>

      <MovementFormSection>
        <FormField
          label={
            <>
              Nota <span className="font-normal text-muted-foreground">(opcional)</span>
            </>
          }
          htmlFor={MOVEMENT_GUIDED_FIELD_IDS.description}
          alignControl
        >
          <FormInput
            id={MOVEMENT_GUIDED_FIELD_IDS.description}
            placeholder={guidedDescriptionPlaceholder(operationKind)}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            disabled={isLoading}
          />
        </FormField>
      </MovementFormSection>

      <Button
        type="button"
        variant="ghost"
        className={cn(scopeToggleClass, 'text-muted-foreground/90')}
        onClick={onToggleScopeOptions}
        disabled={isLoading}
      >
        Proyecto o anticipo de cliente
        {showScopeOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {showScopeOptions ? (
        <MovementScopeFields
          idPrefix="guided-"
          movementScope={movementScope}
          onMovementScopeChange={onMovementScopeChange}
          fundOwner={fundOwner}
          onFundOwnerChange={onFundOwnerChange}
          projectId={projectId}
          onProjectIdChange={onProjectIdChange}
          flatProjects={flatProjects}
          projectLabel={projectLabel}
          isLoading={isLoading}
          isLoadingData={isLoadingData}
        />
      ) : null}
    </div>
  )
}
