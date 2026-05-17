'use client'

import { Plus, Trash2, Wallet } from 'lucide-react'
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
import type { Account } from '@/lib/actions/accounts'
import type { ContactRow } from '@/lib/actions/contacts'
import type { MovementComponentType } from '@/lib/validations/movement'
import { cn } from '@/lib/utils'
import {
  type ComponentLineDraft,
  componentTypesForMovement,
  componentsSumMatchesTotal,
  newComponentLine,
} from '@/components/movements/movement-form.types'

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
}: MovementComponentBreakdownProps) {
  const activeCompTypes = componentTypesForMovement(movementType)
  const sumMatches = componentsSumMatchesTotal(componentLines, totalAmount)
  const componentsSum = componentLines.reduce((acc, line) => {
    const v = parseFloat(line.amount)
    return acc + (Number.isNaN(v) ? 0 : v)
  }, 0)
  const parsedTotal = parseFloat(totalAmount)

  return (
    <div className={cn('space-y-4', compact && 'pt-2')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Wallet className="h-4 w-4" />
          <span>Desglose de cobro/pago</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => onComponentLinesChange((prev) => [...prev, newComponentLine()])}
          disabled={isLoading}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Agregar línea
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        La suma debe coincidir con el monto total ({currency}). Es obligatorio para guardar.
      </p>
      <div
        className={cn(
          'rounded-md border px-3 py-2 text-xs font-medium',
          sumMatches
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        )}
      >
        Suma medios: {Number.isNaN(componentsSum) ? '—' : componentsSum.toFixed(2)} {currency} · Total:{' '}
        {Number.isNaN(parsedTotal) ? '—' : parsedTotal.toFixed(2)} {currency}
      </div>

      <div className="space-y-4">
        {componentLines.map((line, idx) => {
          const selectedTypeLabel =
            activeCompTypes.find((opt) => opt.value === line.componentType)?.label ??
            line.componentType
          const selectedAccount = accounts.find((account) => account.id === line.accountId)
          const selectedContact = filteredContacts.find((c) => c.id === line.contactId)

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
                    size="sm"
                    className="h-8 text-destructive"
                    onClick={() =>
                      onComponentLinesChange((prev) =>
                        prev.filter((l) => l.localId !== line.localId)
                      )
                    }
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={line.componentType}
                  onValueChange={(v) =>
                    onComponentLinesChange((prev) =>
                      prev.map((l) =>
                        l.localId === line.localId
                          ? {
                              ...l,
                              componentType: v as MovementComponentType,
                              accountId:
                                v === 'client_receivable' || v === 'supplier_payable'
                                  ? ''
                                  : l.accountId,
                              contactId:
                                v === 'operative_cash' || v === 'operative_bank'
                                  ? ''
                                  : l.contactId,
                            }
                          : l
                      )
                    )
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
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
              {line.componentType === 'operative_cash' ||
              line.componentType === 'operative_bank' ? (
                <div className="space-y-2">
                  <Label>Cuenta</Label>
                  <Select
                    value={line.accountId}
                    onValueChange={(v) =>
                      onComponentLinesChange((prev) =>
                        prev.map((l) =>
                          l.localId === line.localId ? { ...l, accountId: v ?? '' } : l
                        )
                      )
                    }
                    disabled={isLoading || isLoadingData}
                  >
                    <SelectTrigger className="w-full">
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Contacto</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs shrink-0"
                      onClick={() => onQuickContact(line.localId)}
                    >
                      + Nuevo
                    </Button>
                  </div>
                  <Select
                    value={line.contactId}
                    onValueChange={(v) =>
                      onComponentLinesChange((prev) =>
                        prev.map((l) =>
                          l.localId === line.localId ? { ...l, contactId: v ?? '' } : l
                        )
                      )
                    }
                    disabled={isLoading || isLoadingData}
                  >
                    <SelectTrigger className="w-full">
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
              <div className="space-y-2">
                <Label>Monto línea</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={line.amount}
                  onChange={(e) =>
                    onComponentLinesChange((prev) =>
                      prev.map((l) =>
                        l.localId === line.localId ? { ...l, amount: e.target.value } : l
                      )
                    )
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
