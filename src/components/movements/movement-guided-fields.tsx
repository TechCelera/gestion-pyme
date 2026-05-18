'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
import type { Account } from '@/lib/actions/accounts'
import type { Category } from '@/lib/actions/categories'
import type { ContactRow } from '@/lib/actions/contacts'
import type { FlatProjectOption } from '@/lib/movements/flatten-projects'
import { MOVEMENT_CURRENCIES } from '@/components/movements/movement-form.constants'
import { MovementComponentBreakdown } from '@/components/movements/movement-component-breakdown'
import { MovementScopeFields } from '@/components/movements/movement-scope-fields'
import type { ComponentLineDraft } from '@/components/movements/movement-form.types'
import { cn } from '@/lib/utils'

const fieldLabel = 'text-sm font-medium leading-tight'
const controlH = 'h-10'

export type MovementGuidedFieldsProps = {
  type: 'income' | 'expense'
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
  projectLabel: string
  showAdvanced: boolean
  onToggleAdvanced: () => void
  isLoading?: boolean
  isLoadingData?: boolean
  onNavigateToConfig: () => void
  onQuickContact: (lineLocalId: string) => void
}

function FieldGroup({
  label,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5 min-w-0', className)}>
      <Label htmlFor={htmlFor} className={fieldLabel}>
        {label}
      </Label>
      {children}
    </div>
  )
}

export function MovementGuidedFields({
  type,
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
  projectLabel,
  showAdvanced,
  onToggleAdvanced,
  isLoading,
  isLoadingData,
  onNavigateToConfig,
  onQuickContact,
}: MovementGuidedFieldsProps) {
  const accountLabelText = type === 'income' ? '¿Dónde entró?' : '¿De dónde salió?'

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-3">
        <div className="grid grid-cols-[1fr,5.25rem] gap-2.5">
          <FieldGroup label="¿Cuánto?" htmlFor="amount-guided">
            <MoneyInput
              id="amount-guided"
              value={amount}
              onValueChange={onAmountChange}
              currency={currency}
              disabled={isLoading}
              className={cn('text-lg font-medium', controlH)}
            />
          </FieldGroup>
          <FieldGroup label="Moneda" htmlFor="currency-guided">
            <Select
              value={currency}
              onValueChange={(value) => onCurrencyChange(value ?? 'ARS')}
              disabled={isLoading}
            >
              <SelectTrigger id="currency-guided" className={cn('w-full', controlH)}>
                <SelectValue>
                  {MOVEMENT_CURRENCIES.find((c) => c.value === currency)?.value ?? currency}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.flag} {c.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>

        <div className="grid grid-cols-[minmax(0,8.75rem)_1fr] gap-2.5">
          <FieldGroup label="¿Cuándo?" htmlFor="date-guided">
            <Input
              id="date-guided"
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              disabled={isLoading}
              className={controlH}
            />
          </FieldGroup>
          <FieldGroup label={accountLabelText} htmlFor="account-guided">
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
                <SelectTrigger id="account-guided" className={cn('w-full', controlH)}>
                  <SelectValue>
                    <span className="block truncate" title={accountLabel}>
                      {accountLabel || 'Elegí cuenta'}
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
            )}
          </FieldGroup>
        </div>

        <FieldGroup label="Categoría" htmlFor="category-guided">
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
              <SelectTrigger id="category-guided" className={cn('w-full', controlH)}>
                <SelectValue>
                  <span className="block truncate" title={categoryLabel}>
                    {categoryLabel || 'Elegí categoría'}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldGroup>

        <FieldGroup
          label={
            <>
              Nota{' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </>
          }
          htmlFor="description-guided"
        >
          <Input
            id="description-guided"
            placeholder="Ej: cobro cliente Juan"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            disabled={isLoading}
            className={controlH}
          />
        </FieldGroup>
      </section>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 w-full justify-between text-muted-foreground"
        onClick={onToggleAdvanced}
      >
        Más opciones
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {showAdvanced ? (
        <section className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground leading-snug">
            Proyecto, anticipos o desglose por medios de pago.
          </p>
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
          <Separator />
          <MovementComponentBreakdown
            movementType={type}
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
            manualEntry
          />
        </section>
      ) : null}
    </div>
  )
}
