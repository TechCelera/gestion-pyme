'use client'

import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
import type { Account } from '@/lib/actions/accounts'
import type { Category } from '@/lib/actions/categories'
import type { ContactRow } from '@/lib/actions/contacts'
import type { FlatProjectOption } from '@/lib/movements/flatten-projects'
import { MOVEMENT_CURRENCIES } from '@/components/movements/movement-form.constants'
import { MovementComponentBreakdown } from '@/components/movements/movement-component-breakdown'
import { MovementScopeFields } from '@/components/movements/movement-scope-fields'
import type { ComponentLineDraft } from '@/components/movements/movement-form.types'

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
  isDemoMode?: boolean
  onNavigateToConfig: () => void
  onQuickContact: (lineLocalId: string) => void
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
  isDemoMode,
  onNavigateToConfig,
  onQuickContact,
}: MovementGuidedFieldsProps) {
  const accountQuestion =
    type === 'income' ? '¿En qué cuenta entró?' : '¿De qué cuenta salió?'

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount-guided" className="text-base">
            ¿Cuánto?
          </Label>
          <div className="grid grid-cols-[1fr,auto] gap-3">
            <Input
              id="amount-guided"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              disabled={isLoading}
              className="text-xl h-12"
            />
            <Select
              value={currency}
              onValueChange={(value) => onCurrencyChange(value ?? 'ARS')}
              disabled={isLoading}
            >
              <SelectTrigger id="currency-guided" className="w-24 h-12">
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
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-guided">¿Cuándo?</Label>
          <Input
            id="date-guided"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-guided">{accountQuestion}</Label>
          {!isDemoMode && !isLoadingData && accounts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              <p className="mb-2">Primero creá una cuenta en Configuración.</p>
              <Link
                href="/configuracion"
                onClick={onNavigateToConfig}
                className="text-[#7B68EE] font-medium hover:underline"
              >
                Ir a Configuración
              </Link>
            </div>
          ) : (
            <Select
              value={accountId}
              onValueChange={(v) => onAccountIdChange(v ?? '')}
              disabled={isLoading || isLoadingData}
            >
              <SelectTrigger id="account-guided" className="w-full">
                <SelectValue>
                  <span className="block truncate" title={accountLabel}>
                    {accountLabel || 'Elegí una cuenta'}
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-guided">Categoría (obligatoria)</Label>
          {!isLoadingData && categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay categorías.{' '}
              <Link href="/configuracion" onClick={onNavigateToConfig} className="text-[#7B68EE] hover:underline">
                Creá una en Configuración
              </Link>
              .
            </p>
          ) : (
            <Select
              value={categoryId}
              onValueChange={(v) => onCategoryIdChange(v ?? '')}
              disabled={isLoading || isLoadingData}
            >
              <SelectTrigger id="category-guided" className="w-full">
                <SelectValue>
                  <span className="block truncate" title={categoryLabel}>
                    {categoryLabel || 'Elegí una categoría'}
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="description-guided">
            Nota <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="description-guided"
            placeholder="Ej: cobro cliente Juan"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={onToggleAdvanced}
      >
        Más opciones
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {showAdvanced && (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">
            Proyecto, anticipos de cliente o desglose en varios medios de pago.
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
            isDemoMode={isDemoMode}
            onQuickContact={onQuickContact}
            compact
          />
        </div>
      )}
    </>
  )
}
