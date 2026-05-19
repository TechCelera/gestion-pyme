'use client'

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
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  FormInput,
  FormMoneyInput,
  FormSelectTrigger,
} from '@/components/ui/form-controls'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { MOVEMENT_CURRENCIES, MOVEMENT_METHODS } from '@/components/movements/movement-form.constants'
import { MovementComponentBreakdown } from '@/components/movements/movement-component-breakdown'
import type { Account } from '@/lib/actions/accounts'
import type { Category } from '@/lib/actions/categories'
import type { ContactRow } from '@/lib/actions/contacts'
import type { MovementMethod, MovementType } from '@/lib/validations/movement'
import type { Dispatch, SetStateAction } from 'react'
import type { ComponentLineDraft } from '@/components/movements/movement-form.types'

export interface MovementFormFullFieldsProps {
  type: MovementType
  date: string
  onDateChange: (value: string) => void
  method: MovementMethod
  onMethodChange: (value: MovementMethod) => void
  movementScope: 'general' | 'project'
  onMovementScopeChange: (value: 'general' | 'project') => void
  fundOwner: 'company' | 'client_advance'
  onFundOwnerChange: (value: 'company' | 'client_advance') => void
  projectId: string
  onProjectIdChange: (value: string) => void
  flatProjects: { id: string; name: string }[]
  projectLabel: string
  accounts: Account[]
  isLoading: boolean | undefined
  isLoadingData: boolean
  sourceAccountId: string
  onSourceAccountIdChange: (value: string) => void
  destinationAccountId: string
  onDestinationAccountIdChange: (value: string) => void
  accountId: string
  onAccountIdChange: (value: string) => void
  sourceAccountLabel: string
  destAccountLabel: string
  accountLabel: string
  filteredCategories: Category[]
  categoryId: string
  onCategoryIdChange: (value: string) => void
  categoryLabel: string
  adjustmentReason: string
  onAdjustmentReasonChange: (value: string) => void
  adjustmentReasonLabel: string
  amount: string
  onAmountChange: (value: string) => void
  currency: string
  onCurrencyChange: (value: string) => void
  componentLines: ComponentLineDraft[]
  onComponentLinesChange: Dispatch<SetStateAction<ComponentLineDraft[]>>
  filteredContacts: ContactRow[]
  description: string
  onDescriptionChange: (value: string) => void
  onClose: () => void
  onQuickContact: (lineLocalId: string) => void
  showComponentBreakdown?: boolean
  onToggleComponentBreakdown?: () => void
}

export function MovementFormFullFields(props: MovementFormFullFieldsProps) {
  const {
    type,
    date,
    onDateChange,
    method,
    onMethodChange,
    movementScope,
    onMovementScopeChange,
    fundOwner,
    onFundOwnerChange,
    projectId,
    onProjectIdChange,
    flatProjects,
    projectLabel,
    accounts,
    isLoading,
    isLoadingData,
    sourceAccountId,
    onSourceAccountIdChange,
    destinationAccountId,
    onDestinationAccountIdChange,
    accountId,
    onAccountIdChange,
    sourceAccountLabel,
    destAccountLabel,
    accountLabel,
    filteredCategories,
    categoryId,
    onCategoryIdChange,
    categoryLabel,
    adjustmentReason,
    onAdjustmentReasonChange,
    adjustmentReasonLabel,
    amount,
    onAmountChange,
    currency,
    onCurrencyChange,
    componentLines,
    onComponentLinesChange,
    filteredContacts,
    description,
    onDescriptionChange,
    onClose,
    onQuickContact,
    showComponentBreakdown,
    onToggleComponentBreakdown,
  } = props

  const methodLabel = MOVEMENT_METHODS.find((m) => m.value === method)?.label ?? ''

  return (
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
                  <FormInput
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => onDateChange(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {(type === 'transfer' || type === 'adjustment') && (
                  <div className="space-y-2">
                    <Label htmlFor="method">Método del movimiento</Label>
                    <Select 
                      value={method} 
                      onValueChange={(v) => onMethodChange(v as MovementMethod)}
                      disabled={isLoading}
                    >
                      <FormSelectTrigger id="method">
                        <SelectValue>
                          <span className="block truncate" title={methodLabel}>
                            {methodLabel || 'Seleccione método'}
                          </span>
                        </SelectValue>
                      </FormSelectTrigger>
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
                      onMovementScopeChange(scope)
                      if (scope === 'general') onProjectIdChange('')
                    }}
                    disabled={isLoading}
                  >
                    <FormSelectTrigger id="scope">
                      <SelectValue>
                        <span className="block truncate">
                          {movementScope === 'general' ? 'General empresa' : 'Proyecto/Subproyecto'}
                        </span>
                      </SelectValue>
                    </FormSelectTrigger>
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
                    onValueChange={(value) => onFundOwnerChange((value as 'company' | 'client_advance') ?? 'company')}
                    disabled={isLoading}
                  >
                    <FormSelectTrigger id="fundOwner">
                      <SelectValue>
                        <span className="block truncate">
                          {fundOwner === 'company' ? 'Fondos empresa' : 'Anticipo cliente'}
                        </span>
                      </SelectValue>
                    </FormSelectTrigger>
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
                    onValueChange={(value) => onProjectIdChange(value ?? '')}
                    disabled={isLoading || isLoadingData}
                  >
                    <FormSelectTrigger id="project">
                      <SelectValue>
                        <span className="block truncate" title={projectLabel}>
                          {projectLabel || 'Seleccione proyecto'}
                        </span>
                      </SelectValue>
                    </FormSelectTrigger>
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

              {!isLoadingData && accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 px-4 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 text-center space-y-3">
                  <Wallet className="h-10 w-10 text-muted-foreground/40" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">No tienes cuentas registradas</p>
                    <p className="text-xs text-muted-foreground">Crea una cuenta en Mis cuentas para poder registrar movimientos.</p>
                  </div>
                  <Link
                    href="/cuentas"
                    onClick={onClose}
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
                      onValueChange={(v) => onSourceAccountIdChange(v ?? '')}
                      disabled={isLoading || isLoadingData}
                    >
                      <FormSelectTrigger id="sourceAccount">
                        <SelectValue>
                          <span className="block truncate" title={sourceAccountLabel}>
                            {sourceAccountLabel || (isLoadingData ? 'Cargando...' : 'Seleccione cuenta')}
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destAccount">Cuenta Destino</Label>
                    <Select
                      value={destinationAccountId}
                      onValueChange={(v) => onDestinationAccountIdChange(v ?? '')}
                      disabled={isLoading || isLoadingData}
                    >
                      <FormSelectTrigger id="destAccount">
                        <SelectValue>
                          <span className="block truncate" title={destAccountLabel}>
                            {destAccountLabel || (isLoadingData ? 'Cargando...' : 'Seleccione cuenta')}
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
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="account">
                    {type === 'adjustment' ? 'Cuenta a Ajustar' : 'Cuenta'}
                  </Label>
                  <Select
                    value={accountId}
                    onValueChange={(v) => onAccountIdChange(v ?? '')}
                    disabled={isLoading || isLoadingData}
                  >
                    <FormSelectTrigger id="account">
                      <SelectValue>
                        <span className="block truncate" title={accountLabel}>
                          {accountLabel || (isLoadingData ? 'Cargando...' : 'Seleccione cuenta')}
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
                            Crea categorías para registrar {type === 'income' ? 'ingresos' : 'egresos'}.
                          </p>
                        </div>
                        <Link
                          href="/categorias"
                          onClick={onClose}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#7B68EE] text-white hover:bg-[#7B68EE]/90 transition-colors"
                        >
                          Ir a Categorías
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    ) : (
                      <Select
                        value={categoryId}
                        onValueChange={(v) => onCategoryIdChange(v ?? '')}
                        disabled={isLoading || isLoadingData}
                      >
                        <FormSelectTrigger id="category">
                          <SelectValue>
                            <span className="block truncate" title={categoryLabel}>
                              {categoryLabel || (isLoadingData ? 'Cargando...' : 'Seleccione categoría')}
                            </span>
                          </SelectValue>
                        </FormSelectTrigger>
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
                      onValueChange={(value) => onAdjustmentReasonChange(value ?? '')}
                      disabled={isLoading}
                    >
                      <FormSelectTrigger>
                        <SelectValue>
                          <span className="block truncate" title={adjustmentReasonLabel}>
                            {adjustmentReasonLabel || 'Seleccione motivo'}
                          </span>
                        </SelectValue>
                      </FormSelectTrigger>
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
                  <FormMoneyInput
                    id="amount"
                    value={amount}
                    onValueChange={onAmountChange}
                    currency={currency}
                    disabled={isLoading}
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2 w-28">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select 
                    value={currency} 
                    onValueChange={(value) => onCurrencyChange(value ?? 'ARS')}
                    disabled={isLoading}
                  >
                    <FormSelectTrigger id="currency">
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
                    </FormSelectTrigger>
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

            {(type === 'income' || type === 'expense') && onToggleComponentBreakdown ? (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-full justify-between text-muted-foreground"
                  onClick={onToggleComponentBreakdown}
                  disabled={isLoading}
                >
                  Desglosar por medios de pago
                  {showComponentBreakdown ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                {showComponentBreakdown ? (
                  <MovementComponentBreakdown
                    movementType={type as 'income' | 'expense'}
                    componentLines={componentLines}
                    onComponentLinesChange={onComponentLinesChange}
                    accounts={accounts}
                    filteredContacts={filteredContacts}
                    currency={currency}
                    totalAmount={amount}
                    isLoading={isLoading}
                    isLoadingData={isLoadingData}
                    onQuickContact={onQuickContact}
                    splitEntry
                  />
                ) : null}
              </div>
            ) : null}


            {/* Section: Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Descripción</span>
              </div>
              <div className="space-y-2">
                <FormInput
                  placeholder="Describe el movimiento..."
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
    </>
  )
}
