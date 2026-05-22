'use client'

import { useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  FormMoneyInput,
  FormSelectTrigger,
  formControlHeightClass,
} from '@/components/ui/form-controls'

const paymentRowGridClass =
  'grid grid-cols-[minmax(0,1fr)_7.5rem_2.5rem] items-center gap-x-2'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import type { Account } from '@/lib/actions/accounts'
import type { ContactRow } from '@/lib/actions/contacts'
import type { OperationKind } from '@/lib/validations/movement'
import { cn } from '@/lib/utils'
import {
  MOVEMENT_GUIDED_FIELD_IDS,
  type ComponentLineDraft,
} from '@/components/movements/movement-form.types'
import {
  guidedAddPaymentRowLabel,
  guidedPaymentQuestion,
  guidedPaymentRowAccountLabel,
  guidedPaymentRowAmountLabel,
  guidedPaymentTotalLabel,
} from '@/components/movements/movement-form-guided-copy'
import {
  CREDIT_PICKER_VALUE,
  applyAccountPickerValue,
  creditPickerLabel,
  defaultPaymentLine,
  formatAllocationAmountCanonical,
  isCreditMedium,
  linePickerValue,
  sumComponentLineAmounts,
} from '@/lib/movements/payment-medium'
import { isCollectionOrPaymentKind } from '@/lib/movements/operation-kind'

export type MovementFriendlyPaymentBreakdownProps = {
  movementType: 'income' | 'expense'
  operationKind: OperationKind
  componentLines: ComponentLineDraft[]
  onComponentLinesChange: (
    updater: (prev: ComponentLineDraft[]) => ComponentLineDraft[]
  ) => void
  accounts: Account[]
  filteredContacts: ContactRow[]
  currency: string
  mainContactId?: string
  mainContactLabel?: string
  isLoading?: boolean
  isLoadingData?: boolean
  onQuickContact?: (lineLocalId: string) => void
}

function AccountRowExtras({
  line,
  movementType,
  useMainContactForCredit,
  mainContactLabel,
  filteredContacts,
  isLoading,
  isLoadingData,
  onQuickContact,
  onContactChange,
}: {
  line: ComponentLineDraft
  movementType: 'income' | 'expense'
  useMainContactForCredit: boolean
  mainContactLabel: string
  filteredContacts: ContactRow[]
  isLoading?: boolean
  isLoadingData?: boolean
  onQuickContact?: (lineLocalId: string) => void
  onContactChange: (contactId: string) => void
}) {
  const credit = isCreditMedium(line.componentType, movementType)
  const selectedContact = filteredContacts.find((c) => c.id === line.contactId)

  if (!credit) return null

  if (useMainContactForCredit) {
    return (
      <p className="text-xs text-muted-foreground">
        A nombre de{' '}
        <span className="font-medium text-foreground">
          {mainContactLabel || 'el contacto de arriba'}
        </span>
      </p>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={line.contactId || undefined}
        onValueChange={(v) => onContactChange(v ?? '')}
        disabled={isLoading || isLoadingData}
      >
        <FormSelectTrigger className="min-w-0 flex-1">
          <SelectValue>
            <span className="block truncate">
              {selectedContact?.name ??
                (filteredContacts.length ? 'Elegí contacto' : 'Sin contactos')}
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
      {onQuickContact ? (
        <Button
          type="button"
          variant="outline"
          className={cn(formControlHeightClass, 'shrink-0 px-3 text-xs')}
          onClick={() => onQuickContact(line.localId)}
          disabled={isLoading}
        >
          + Nuevo
        </Button>
      ) : null}
    </div>
  )
}

export function MovementFriendlyPaymentBreakdown({
  movementType,
  operationKind,
  componentLines,
  onComponentLinesChange,
  accounts,
  filteredContacts,
  currency,
  mainContactId = '',
  mainContactLabel = '',
  isLoading,
  isLoadingData,
  onQuickContact,
}: MovementFriendlyPaymentBreakdownProps) {
  const useMainContactForCredit =
    isCollectionOrPaymentKind(operationKind) && Boolean(mainContactId)
  const creditLabel = creditPickerLabel(movementType, operationKind)
  const totalSum = sumComponentLineAmounts(componentLines)
  const totalDisplay =
    totalSum > 0 ? formatAllocationAmountCanonical(totalSum, currency) : ''

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ rowIndex?: number; canonical?: string }>).detail
      const canonical = detail?.canonical?.trim()
      if (!canonical) return
      const rowIndex = detail?.rowIndex ?? 0
      onComponentLinesChange((prev) => {
        if (rowIndex < 0 || rowIndex >= prev.length) return prev
        return prev.map((line, idx) =>
          idx === rowIndex ? { ...line, amount: canonical } : line
        )
      })
    }
    window.addEventListener('gestion-pyme:e2e-set-guided-payment-amount', handler)
    return () => {
      window.removeEventListener('gestion-pyme:e2e-set-guided-payment-amount', handler)
    }
  }, [onComponentLinesChange])

  function handleAddRow() {
    onComponentLinesChange((prev) => [
      ...prev,
      defaultPaymentLine(movementType, accounts, { amount: '' }),
    ])
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        {guidedPaymentQuestion(operationKind, movementType)}
      </h3>

      <div className="space-y-3">
        <div
          className={cn(paymentRowGridClass, 'text-xs font-medium text-muted-foreground')}
        >
          <span>{guidedPaymentRowAccountLabel()}</span>
          <span>{guidedPaymentRowAmountLabel()}</span>
          <span className="sr-only">Acciones</span>
        </div>

        {componentLines.map((line, idx) => {
          const canDelete = componentLines.length > 1
          return (
          <div key={line.localId} className="space-y-2">
            <div className={paymentRowGridClass}>
              <Select
                value={linePickerValue(line, movementType) || undefined}
                onValueChange={(v) => {
                  if (!v) return
                  onComponentLinesChange((prev) =>
                    prev.map((l) =>
                      l.localId === line.localId
                        ? applyAccountPickerValue(l, v, movementType, accounts)
                        : l
                    )
                  )
                }}
                disabled={isLoading || isLoadingData}
              >
                <FormSelectTrigger
                  id={idx === 0 ? MOVEMENT_GUIDED_FIELD_IDS.account : undefined}
                  aria-label={guidedPaymentRowAccountLabel()}
                >
                  <SelectValue>
                    <span className="block truncate">
                      {linePickerValue(line, movementType) === CREDIT_PICKER_VALUE
                        ? creditLabel
                        : accounts.find((a) => a.id === line.accountId)?.name ?? 'Elegí cuenta'}
                    </span>
                  </SelectValue>
                </FormSelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.currency})
                    </SelectItem>
                  ))}
                  <SelectItem value={CREDIT_PICKER_VALUE}>{creditLabel}</SelectItem>
                </SelectContent>
              </Select>

              <FormMoneyInput
                id={idx === 0 ? MOVEMENT_GUIDED_FIELD_IDS.amount : undefined}
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
                aria-label={guidedPaymentRowAmountLabel()}
              />

              <div className="flex h-10 items-center justify-center">
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(formControlHeightClass, 'h-10 w-10 text-destructive')}
                    onClick={() =>
                      onComponentLinesChange((prev) =>
                        prev.filter((l) => l.localId !== line.localId)
                      )
                    }
                    disabled={isLoading}
                    aria-label="Quitar fila"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <span className="h-10 w-10" aria-hidden />
                )}
              </div>
            </div>

            <AccountRowExtras
              line={line}
              movementType={movementType}
              useMainContactForCredit={useMainContactForCredit}
              mainContactLabel={mainContactLabel}
              filteredContacts={filteredContacts}
              isLoading={isLoading}
              isLoadingData={isLoadingData}
              onQuickContact={onQuickContact}
              onContactChange={(contactId) =>
                onComponentLinesChange((prev) =>
                  prev.map((l) => (l.localId === line.localId ? { ...l, contactId } : l))
                )
              }
            />
          </div>
          )
        })}
      </div>

      <Button
        type="button"
        variant="link"
        className="h-auto p-0 text-sm font-normal text-primary"
        onClick={handleAddRow}
        disabled={isLoading}
      >
        <Plus className="h-4 w-4 mr-1 inline" />
        {guidedAddPaymentRowLabel()}
      </Button>

      <div className="rounded-lg border border-border/80 bg-background px-3 py-2.5">
        <p className="text-xs font-medium text-muted-foreground">{guidedPaymentTotalLabel()}</p>
        <p className="text-lg font-semibold tabular-nums text-foreground">
          {totalSum > 0 ? totalDisplay : '—'}{' '}
          <span className="text-sm font-medium text-muted-foreground">{currency}</span>
        </p>
      </div>
    </div>
  )
}
