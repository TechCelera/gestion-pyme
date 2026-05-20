'use client'

import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  FormField,
  FormInput,
  FormMoneyInput,
  FormSelectTrigger,
  formSegmentButtonClass,
} from '@/components/ui/form-controls'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import type { Account } from '@/lib/actions/accounts'
import type { Category } from '@/lib/actions/categories'
import type { ContactRow } from '@/lib/actions/contacts'
import type { FlatProjectOption } from '@/lib/movements/flatten-projects'
import { MOVEMENT_CURRENCIES } from '@/components/movements/movement-form.constants'
import { MovementComponentBreakdown } from '@/components/movements/movement-component-breakdown'
import { MovementScopeFields } from '@/components/movements/movement-scope-fields'
import type { ComponentLineDraft } from '@/components/movements/movement-form.types'
import { buildCashDateContext } from '@/lib/movements/cash-date-context'
import {
  OPERATION_CASH_DATE_HINT_COPY,
  OPERATION_CONTACT_HELP_COPY,
} from '@/lib/movements/movement-config'
import { isCollectionOrPaymentKind, isSaleOrPurchaseKind } from '@/lib/movements/operation-kind'
import type { OperationKind } from '@/lib/validations/movement'
import { cn } from '@/lib/utils'

const toggleBtn = cn(formSegmentButtonClass(), 'w-full justify-between px-4 text-muted-foreground')

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

export function MovementGuidedFields({
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
}: MovementGuidedFieldsProps) {
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

  const accountLabelText =
    operationKind === 'collection'
      ? '¿En qué cuenta entró?'
      : operationKind === 'payment'
        ? '¿De qué cuenta salió?'
        : type === 'income'
          ? '¿Dónde entró?'
          : '¿De dónde salió?'

  const paymentModeQuestion = isCollectionPayment
    ? '¿Se cobró en más de una cuenta?'
    : type === 'income'
      ? '¿Entró todo de una vez?'
      : '¿Salió todo de una vez?'

  const singleAccountLabel = isCollectionPayment
    ? 'En una cuenta'
    : type === 'income'
      ? 'En una cuenta'
      : 'De una cuenta'
  const splitAccountsLabel = 'Repartido en varias'

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-3">
        <div className="grid grid-cols-[1fr,5.25rem] gap-2.5">
          <FormField label="¿Cuánto?" htmlFor="amount-guided" alignControl>
            <FormMoneyInput
              id="amount-guided"
              value={amount}
              onValueChange={onAmountChange}
              currency={currency}
              disabled={isLoading}
              className="text-lg font-medium"
            />
          </FormField>
          <FormField label="Moneda" htmlFor="currency-guided" alignControl>
            <Select
              value={currency}
              onValueChange={(value) => onCurrencyChange(value ?? 'ARS')}
              disabled={isLoading}
            >
              <FormSelectTrigger id="currency-guided">
                <SelectValue>
                  {MOVEMENT_CURRENCIES.find((c) => c.value === currency)?.value ?? currency}
                </SelectValue>
              </FormSelectTrigger>
              <SelectContent>
                {MOVEMENT_CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.flag} {c.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField label="¿Cuándo?" htmlFor="date-guided" alignControl>
          <FormInput
            id="date-guided"
            type="date"
            value={date}
            min={dateBounds?.min}
            max={dateBounds?.max}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={isLoading}
          />
        </FormField>
        {dateBounds ? (
          <p className="text-xs text-muted-foreground">{OPERATION_CASH_DATE_HINT_COPY}</p>
        ) : null}

        {isCollectionPayment ? (
          <FormField
            label={operationKind === 'collection' ? 'Cliente' : 'Proveedor'}
            htmlFor="contact-guided"
            alignControl
          >
            <Select
              value={contactId}
              onValueChange={(v) => onContactIdChange(v ?? '')}
              disabled={isLoading || isLoadingData}
            >
              <FormSelectTrigger id="contact-guided">
                <SelectValue>
                  <span className="block truncate" title={contactLabel}>
                    {contactLabel || 'Elegí contacto'}
                  </span>
                </SelectValue>
              </FormSelectTrigger>
              <SelectContent>
                {filteredContacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              {OPERATION_CONTACT_HELP_COPY}
            </p>
          </FormField>
        ) : null}

        <FormField label={paymentModeQuestion} htmlFor="payment-mode-single">
          <div
            role="group"
            aria-label={paymentModeQuestion}
            className="grid grid-cols-2 gap-2"
          >
            <Button
              id="payment-mode-single"
              type="button"
              variant={showPaymentSplit ? 'outline' : 'default'}
              className={formSegmentButtonClass()}
              onClick={() => onPaymentModeChange(false)}
              disabled={isLoading}
              aria-pressed={!showPaymentSplit}
            >
              {singleAccountLabel}
            </Button>
            <Button
              id="payment-mode-split"
              type="button"
              variant={showPaymentSplit ? 'default' : 'outline'}
              className={formSegmentButtonClass()}
              onClick={() => onPaymentModeChange(true)}
              disabled={isLoading}
              aria-pressed={showPaymentSplit}
            >
              {splitAccountsLabel}
            </Button>
          </div>
        </FormField>

        {!showPaymentSplit ? (
          <FormField label={accountLabelText} htmlFor="account-guided" alignControl>
            {!isLoadingData && accounts.length === 0 ? (
              <div className="flex h-10 items-center justify-center rounded-lg border border-dashed px-2 text-center text-xs text-muted-foreground">
                <Link
                  href="/cuentas"
                  onClick={onNavigateToConfig}
                  className="text-[#7B68EE] font-medium hover:underline"
                >
                  Crear cuenta
                </Link>
              </div>
            ) : (
              <Select
                value={accountId}
                onValueChange={(v) => onAccountIdChange(v ?? '')}
                disabled={isLoading || isLoadingData}
              >
                <FormSelectTrigger id="account-guided">
                  <SelectValue>
                    <span className="block truncate" title={accountLabel}>
                      {accountLabel || 'Elige cuenta'}
                    </span>
                  </SelectValue>
                </FormSelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
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

        {isSalePurchase ? (
          <FormField
            label="Categoría"
            htmlFor="category-guided"
            alignControl={isLoadingData || categories.length > 0}
          >
            {!isLoadingData && categories.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                Sin categorías.{' '}
                <Link
                  href="/categorias"
                  onClick={onNavigateToConfig}
                  className="text-[#7B68EE] hover:underline"
                >
                  Crear en Categorías
                </Link>
              </p>
            ) : (
              <Select
                value={categoryId}
                onValueChange={(v) => onCategoryIdChange(v ?? '')}
                disabled={isLoading || isLoadingData}
              >
                <FormSelectTrigger id="category-guided">
                  <SelectValue>
                    <span className="block truncate" title={categoryLabel}>
                      {categoryLabel || 'Elige categoría'}
                    </span>
                  </SelectValue>
                </FormSelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        ) : null}

        <FormField
          label={
            <>
              Nota{' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </>
          }
          htmlFor="description-guided"
          alignControl
        >
          <FormInput
            id="description-guided"
            placeholder={
              isCollectionPayment
                ? 'Ej: cobro parcial factura 120'
                : 'Ej: venta mostrador'
            }
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            disabled={isLoading}
          />
        </FormField>
      </section>

      <Button
        type="button"
        variant="ghost"
        className={cn(toggleBtn, 'text-muted-foreground/90')}
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
