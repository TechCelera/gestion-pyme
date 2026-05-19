'use client'

import { Plus, Trash2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MoneyInput } from '@/components/ui/money-input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Account } from '@/lib/actions/accounts'
import type { ContactRow } from '@/lib/actions/contacts'
import type { MovementComponentType } from '@/lib/validations/movement'
import {
  formatMoneyInputFromCanonical,
  getMoneyFractionDigits,
} from '@/lib/utils/money-input'
import { cn } from '@/lib/utils'
import { MOVEMENT_FORM_CONTROL_H } from '@/components/movements/movement-form.constants'
import {
  type ComponentLineDraft,
  componentTypesForMovement,
  componentsSumMatchesTotal,
  lineAmountToNumber,
  newComponentLine,
} from '@/components/movements/movement-form.types'

const controlClass = `${MOVEMENT_FORM_CONTROL_H} w-full`

export type MovementComponentBreakdownProps = {
  movementType: 'income' | 'expense'
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
  manualEntry?: boolean
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
  manualEntry = true,
}: MovementComponentBreakdownProps) {
  const activeCompTypes = componentTypesForMovement(movementType)
  const sumMatches = componentsSumMatchesTotal(componentLines, totalAmount)
  const componentsSum = componentLines.reduce((acc, line) => {
    const v = lineAmountToNumber(line.amount)
    return acc + (Number.isNaN(v) ? 0 : v)
  }, 0)
  const parsedTotal = lineAmountToNumber(totalAmount)

  return (
    <div className={cn('space-y-4', compact && 'pt-2')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Wallet className="h-4 w-4 shrink-0" />
          <span>Desglose de cobro/pago</span>
        </div>
        <Button
          type="button"
          variant="outline"
          className={cn(MOVEMENT_FORM_CONTROL_H, 'px-4')}
          onClick={() => onComponentLinesChange((prev) => [...prev, newComponentLine()])}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Agregar línea
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {manualEntry
          ? `La suma debe coincidir con el monto total (${currency}). Es obligatorio para guardar.`
          : `Opcional: si no usas líneas, al guardar se toma la cuenta principal. Si agregas líneas, la suma debe coincidir con el total (${currency}).`}
      </p>
      <div
        className={cn(
          'rounded-md border px-3 py-2 text-xs font-medium tabular-nums',
          sumMatches
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        )}
      >
        Suma medios: {formatAmountDisplay(componentsSum, currency)} {currency} · Total:{' '}
        {Number.isNaN(parsedTotal)
          ? '—'
          : `${formatAmountDisplay(totalAmount, currency)} ${currency}`}
      </div>

      <div className="space-y-4">
        {componentLines.map((line, idx) => {
          const selectedTypeLabel =
            activeCompTypes.find((opt) => opt.value === line.componentType)?.label ??
            line.componentType
          const selectedAccount = accounts.find((account) => account.id === line.accountId)
          const selectedContact = filteredContacts.find((c) => c.id === line.contactId)
          const needsAccount = isOperativeComponent(line.componentType)

          return (
            <div
              key={line.localId}
              className="rounded-lg border border-muted p-3 space-y-3 bg-muted/20"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Línea {idx + 1}</span>
                {componentLines.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(MOVEMENT_FORM_CONTROL_H, 'w-10 shrink-0 text-destructive')}
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
                  <SelectTrigger className={controlClass}>
                    <SelectValue>
                      <span className="block truncate" title={selectedTypeLabel}>
                        {selectedTypeLabel}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activeCompTypes.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {needsAccount ? (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Cuenta</Label>
                  <Select
                    value={line.accountId || undefined}
                    onValueChange={(v) =>
                      onComponentLinesChange((prev) =>
                        prev.map((l) =>
                          l.localId === line.localId ? { ...l, accountId: v ?? '' } : l
                        )
                      )
                    }
                    disabled={isLoading || isLoadingData}
                  >
                    <SelectTrigger className={controlClass}>
                      <SelectValue>
                        <span
                          className="block truncate"
                          title={
                            selectedAccount
                              ? `${selectedAccount.name} (${selectedAccount.currency})`
                              : 'Seleccione cuenta'
                          }
                        >
                          {selectedAccount
                            ? `${selectedAccount.name} (${selectedAccount.currency})`
                            : 'Seleccione cuenta'}
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
                    <SelectTrigger className={controlClass}>
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
                    </SelectTrigger>
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
                <Label className="text-sm font-medium">Monto línea</Label>
                <MoneyInput
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
                  className={controlClass}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
