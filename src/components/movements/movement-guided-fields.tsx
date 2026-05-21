'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormCreatableSelect, FormField, FormInput } from '@/components/ui/form-controls'
import { MovementComponentBreakdown } from '@/components/movements/movement-component-breakdown'
import { MovementScopeFields } from '@/components/movements/movement-scope-fields'
import {
  MovementAccountField,
  MovementAmountCurrencyFields,
  MovementCategoryField,
  MovementDateField,
  MovementFormSection,
  MovementPaymentModeField,
} from '@/components/movements/form-fields'
import {
  guidedAccountLabel,
  guidedDescriptionPlaceholder,
  guidedPaymentModeQuestion,
  guidedSingleAccountBackLabel,
  guidedSingleAccountLabel,
  guidedSplitLinkLabel,
} from '@/components/movements/movement-form-guided-copy'
import {
  GUIDED_MAIN_CONTACT_LINE_ID,
  MOVEMENT_GUIDED_FIELD_IDS,
  type ComponentLineDraft,
} from '@/components/movements/movement-form.types'
import { buildCashDateContext } from '@/lib/movements/cash-date-context'
import {
  OPERATION_CONTACT_HELP_COPY,
} from '@/lib/movements/movement-config'
import { isCollectionOrPaymentKind, isSaleOrPurchaseKind } from '@/lib/movements/operation-kind'
import type { Account } from '@/lib/actions/accounts'
import type { Category } from '@/lib/actions/categories'
import type { ContactRow } from '@/lib/actions/contacts'
import type { FlatProjectOption } from '@/lib/movements/flatten-projects'
import type { OperationKind } from '@/lib/validations/movement'
import { cn } from '@/lib/utils'
import { formSegmentButtonClass } from '@/components/ui/form-controls'

const scopeToggleClass = cn(formSegmentButtonClass(), 'w-full justify-between px-4 text-muted-foreground')

export type MovementGuidedFieldsProps = {
  type: 'income' | 'expense'
  operationKind: OperationKind
  amount: string
  onAmountChange: (value: string) => void
  currency: string
  onCurrencyChange: (value: string) => void
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
    amount,
    onAmountChange,
    currency,
    onCurrencyChange,
    date,
    onDateChange,
    accountId,
    onAccountIdChange,
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
    accountLabel,
    categoryLabel,
    contactLabel,
    projectLabel,
    showScopeOptions,
    onToggleScopeOptions,
    showPaymentSplit,
    onPaymentModeChange,
    isLoading,
    isLoadingData,
    onNavigateToConfig,
    onQuickContact,
  } = props

  const isCollectionPayment = isCollectionOrPaymentKind(operationKind)
  const isSalePurchase = isSaleOrPurchaseKind(operationKind)

  const { bounds: dateBounds } = buildCashDateContext({
    movementScope,
    showPaymentSplit,
    componentLines,
    accountId,
    accounts,
    date,
  })

  return (
    <div className="space-y-3">
      <MovementFormSection>
        <MovementAmountCurrencyFields
          amount={amount}
          onAmountChange={onAmountChange}
          currency={currency}
          onCurrencyChange={onCurrencyChange}
          disabled={isLoading}
        />

        <MovementDateField
          date={date}
          onDateChange={onDateChange}
          min={dateBounds?.min}
          max={dateBounds?.max}
          showCashHint={Boolean(dateBounds)}
          disabled={isLoading}
        />

        {isCollectionPayment ? (
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
        ) : null}

        {isCollectionPayment ? (
          <>
            {!showPaymentSplit ? (
              <>
                <MovementAccountField
                  label={guidedAccountLabel(operationKind, type)}
                  accountId={accountId}
                  onAccountIdChange={onAccountIdChange}
                  accounts={accounts}
                  accountLabel={accountLabel}
                  disabled={isLoading}
                  isLoadingData={isLoadingData}
                  onNavigateToSetup={onNavigateToConfig}
                />
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0 text-sm text-muted-foreground"
                  onClick={() => onPaymentModeChange(true)}
                  disabled={isLoading}
                >
                  {guidedSplitLinkLabel(operationKind)}
                </Button>
              </>
            ) : (
              <section className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <MovementComponentBreakdown
                  movementType={type}
                  operationKind={operationKind}
                  componentLines={componentLines}
                  onComponentLinesChange={onComponentLinesChange}
                  accounts={accounts}
                  filteredContacts={filteredContacts}
                  currency={currency}
                  totalAmount={amount}
                  isLoading={isLoading}
                  isLoadingData={isLoadingData}
                  onQuickContact={onQuickContact}
                  compact
                  splitEntry
                  simpleAccountSplit
                />
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0 text-sm"
                  onClick={() => onPaymentModeChange(false)}
                  disabled={isLoading}
                >
                  {guidedSingleAccountBackLabel(operationKind)}
                </Button>
              </section>
            )}
          </>
        ) : (
          <>
            <MovementPaymentModeField
              question={guidedPaymentModeQuestion(operationKind, type)}
              singleLabel={guidedSingleAccountLabel(operationKind, type)}
              showPaymentSplit={showPaymentSplit}
              onPaymentModeChange={onPaymentModeChange}
              disabled={isLoading}
            />
            {!showPaymentSplit ? (
              <MovementAccountField
                label={guidedAccountLabel(operationKind, type)}
                accountId={accountId}
                onAccountIdChange={onAccountIdChange}
                accounts={accounts}
                accountLabel={accountLabel}
                disabled={isLoading}
                isLoadingData={isLoadingData}
                onNavigateToSetup={onNavigateToConfig}
              />
            ) : null}
            {showPaymentSplit ? (
              <section className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <MovementComponentBreakdown
                  movementType={type}
                  operationKind={operationKind}
                  componentLines={componentLines}
                  onComponentLinesChange={onComponentLinesChange}
                  accounts={accounts}
                  filteredContacts={filteredContacts}
                  currency={currency}
                  totalAmount={amount}
                  isLoading={isLoading}
                  isLoadingData={isLoadingData}
                  onQuickContact={onQuickContact}
                  compact
                  splitEntry
                />
              </section>
            ) : null}
          </>
        )}

        {isSalePurchase ? (
          <MovementCategoryField
            categoryId={categoryId}
            onCategoryIdChange={onCategoryIdChange}
            categories={categories}
            categoryLabel={categoryLabel}
            disabled={isLoading}
            isLoadingData={isLoadingData}
            onNavigateToSetup={onNavigateToConfig}
          />
        ) : null}

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
