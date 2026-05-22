'use client'

import { Plus, Trash2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  FormMoneyInput,
  FormSelectTrigger,
  formControlHeightClass,
} from '@/components/ui/form-controls'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import type { Account } from '@/lib/actions/accounts'
import type { ContactRow } from '@/lib/actions/contacts'
import type { MovementComponentType, OperationKind } from '@/lib/validations/movement'
import {
  formatMoneyInputFromCanonical,
  getMoneyFractionDigits,
} from '@/lib/utils/money-input'
import { cn } from '@/lib/utils'
import {
  MOVEMENT_GUIDED_FIELD_IDS,
  type ComponentLineDraft,
  componentTypesForMovement,
  componentsSumMatchesTotal,
  lineAmountToNumber,
  newComponentLine,
  splitRemainderAmount,
  withAccountComponentType,
} from '@/components/movements/movement-form.types'

export type MovementComponentBreakdownProps = {
  movementType: 'income' | 'expense'
  operationKind?: OperationKind | null
  componentLines: ComponentLineDraft[]
  onComponentLinesChange: (
    updater: (prev: ComponentLineDraft[]) => ComponentLineDraft[]
  ) => void
  accounts: Account[]
  filteredContacts: ContactRow[]
  currency: string
  totalAmount: string
  isLoading?: boolean
  isLoadingData?: boolean
  onQuickContact: (lineLocalId: string) => void
  compact?: boolean
  splitEntry?: boolean
  /** Cobro/pago: solo cuenta + monto (sin selector de tipo contable). */
  simpleAccountSplit?: boolean
  sectionTitle?: string
  sectionHint?: string
}

function formatAmountDisplay(value: string | number, currency: string): string {
  const digits = getMoneyFractionDigits(currency)
  const canonical = typeof value === 'number' ? String(value) : value
  const formatted = formatMoneyInputFromCanonical(canonical, digits)
  if (formatted) return formatted
  const n = typeof value === 'number' ? value : lineAmountToNumber(canonical)
  if (Number.isNaN(n)) return '—'
  return formatMoneyInputFromCanonical(String(n), digits)
}

function isOperativeComponent(type: MovementComponentType): boolean {
  return type === 'operative_cash' || type === 'operative_bank'
}

export function MovementComponentBreakdown({
  movementType,
  operationKind,
  componentLines,
  onComponentLinesChange,
  accounts,
  filteredContacts,
  currency,
  totalAmount,
  isLoading,
  isLoadingData,
  onQuickContact,
  compact,
  splitEntry = false,
  simpleAccountSplit = false,
  sectionTitle,
  sectionHint,
}: MovementComponentBreakdownProps) {
  const activeCompTypes = componentTypesForMovement(movementType, operationKind)
  const sumMatches = componentsSumMatchesTotal(componentLines, totalAmount)
  const componentsSum = componentLines.reduce((acc, line) => {
    const v = lineAmountToNumber(line.amount)
    return acc + (Number.isNaN(v) ? 0 : v)
  }, 0)
  const parsedTotal = lineAmountToNumber(totalAmount)

  return (
    <div className={cn('space-y-4', compact && 'pt-2')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Wallet className="h-4 w-4 shrink-0" />
          <span>
            {sectionTitle ??
              (simpleAccountSplit ? '¿De dónde salió / entró el dinero?' : 'Desglose de cobro/pago')}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          className={cn(formControlHeightClass, 'px-4')}
          onClick={() => onComponentLinesChange((prev) => [...prev, newComponentLine()])}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {simpleAccountSplit ? 'Otra cuenta' : 'Agregar cuenta'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {sectionHint ??
          (simpleAccountSplit
            ? `Indicá cuánto por cada cuenta (${currency}). La suma debe coincidir con el total.`
            : splitEntry
              ? `Indicá en qué cuentas o medios se repartió el total (${currency}). La suma de las líneas debe coincidir.`
              : `Opcional: si no usas líneas, al guardar se toma la cuenta principal del movimiento.`)}
      </p>
      <p
        className={cn(
          'text-xs tabular-nums',
          sumMatches ? 'text-green-800' : 'text-amber-900'
        )}
      >
        {sumMatches ? (
          <>Suma correcta ({formatAmountDisplay(componentsSum, currency)} {currency})</>
        ) : (
          <>
            Suma {formatAmountDisplay(componentsSum, currency)} {currency} · Total{' '}
            {Number.isNaN(parsedTotal)
              ? '—'
              : `${formatAmountDisplay(totalAmount, currency)} ${currency}`}
          </>
        )}
      </p>

      <div className="space-y-4">
        {componentLines.map((line, idx) => {
          const selectedTypeLabel =
            activeCompTypes.find((opt) => opt.value === line.componentType)?.label ??
            line.componentType
          const selectedAccount = accounts.find((account) => account.id === line.accountId)
          const selectedContact = filteredContacts.find((c) => c.id === line.contactId)
          const needsAccount =
            simpleAccountSplit || isOperativeComponent(line.componentType)
          const remainder = simpleAccountSplit
            ? splitRemainderAmount(componentLines, totalAmount, line.localId)
            : null
          const canFillRemainder =
            remainder !== null && remainder > 0 && !Number.isNaN(remainder)

          return (
            <div
              key={line.localId}
              className="rounded-lg border border-muted p-3 space-y-3 bg-muted/20"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {simpleAccountSplit ? `Medio ${idx + 1}` : `Línea ${idx + 1}`}
                </span>
                {componentLines.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(formControlHeightClass, 'w-10 shrink-0 text-destructive')}
                    onClick={() =>
                      onComponentLinesChange((prev) =>
                        prev.filter((l) => l.localId !== line.localId)
                      )
                    }
                    disabled={isLoading}
                    aria-label="Eliminar línea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              {!simpleAccountSplit ? (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Tipo</Label>
                  <Select
                    value={line.componentType}
                    onValueChange={(v) => {
                      const nextType = v as MovementComponentType
                      const operative = isOperativeComponent(nextType)
                      onComponentLinesChange((prev) =>
                        prev.map((l) =>
                          l.localId === line.localId
                            ? {
                                ...l,
                                componentType: nextType,
                                accountId: operative ? l.accountId : '',
                                contactId: operative ? '' : l.contactId,
                              }
                            : l
                        )
                      )
                    }}
                    disabled={isLoading}
                  >
                    <FormSelectTrigger>
                      <SelectValue>
                        <span className="block truncate" title={selectedTypeLabel}>
                          {selectedTypeLabel}
                        </span>
                      </SelectValue>
                    </FormSelectTrigger>
                    <SelectContent>
                      {activeCompTypes.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {needsAccount ? (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Cuenta</Label>
                  <Select
                    value={line.accountId || undefined}
                    onValueChange={(v) =>
                      onComponentLinesChange((prev) =>
                        prev.map((l) =>
                          l.localId === line.localId
                            ? simpleAccountSplit
                              ? withAccountComponentType(l, v ?? '', accounts)
                              : { ...l, accountId: v ?? '' }
                            : l
                        )
                      )
                    }
                    disabled={isLoading || isLoadingData}
                  >
                    <FormSelectTrigger
                      id={
                        simpleAccountSplit && idx === 0
                          ? MOVEMENT_GUIDED_FIELD_IDS.account
                          : undefined
                      }
                    >
                      <SelectValue>
                        <span
                          className="block truncate"
                          title={
                            selectedAccount
                              ? `${selectedAccount.name} (${selectedAccount.currency})`
                              : 'Elige cuenta'
                          }
                        >
                          {selectedAccount
                            ? `${selectedAccount.name} (${selectedAccount.currency})`
                            : 'Elige cuenta'}
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
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm font-medium">Contacto</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-3 text-xs shrink-0"
                      onClick={() => onQuickContact(line.localId)}
                    >
                      + Nuevo
                    </Button>
                  </div>
                  <Select
                    value={line.contactId || undefined}
                    onValueChange={(v) =>
                      onComponentLinesChange((prev) =>
                        prev.map((l) =>
                          l.localId === line.localId ? { ...l, contactId: v ?? '' } : l
                        )
                      )
                    }
                    disabled={isLoading || isLoadingData}
                  >
                    <FormSelectTrigger>
                      <SelectValue>
                        <span
                          className="block truncate"
                          title={
                            selectedContact?.name ??
                            (filteredContacts.length
                              ? 'Seleccione contacto'
                              : 'Sin contactos — crealos en Configuración')
                          }
                        >
                          {selectedContact?.name ??
                            (filteredContacts.length
                              ? 'Seleccione contacto'
                              : 'Sin contactos — crealos en Configuración')}
                        </span>
                      </SelectValue>
                    </FormSelectTrigger>
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
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Monto</Label>
                <FormMoneyInput
                  id={
                    simpleAccountSplit && idx === 0 ? MOVEMENT_GUIDED_FIELD_IDS.amount : undefined
                  }
                  value={line.amount}
                  onValueChange={(canonical) =>
                    onComponentLinesChange((prev) =>
                      prev.map((l) =>
                        l.localId === line.localId ? { ...l, amount: canonical } : l
                      )
                    )
                  }
                  currency={currency}
                  disabled={isLoading}
                />
                {canFillRemainder ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      const digits = getMoneyFractionDigits(currency)
                      const canonical = formatMoneyInputFromCanonical(String(remainder), digits)
                      onComponentLinesChange((prev) =>
                        prev.map((l) =>
                          l.localId === line.localId ? { ...l, amount: canonical } : l
                        )
                      )
                    }}
                    disabled={isLoading}
                  >
                    Completar resto ({formatAmountDisplay(remainder!, currency)})
                  </Button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
