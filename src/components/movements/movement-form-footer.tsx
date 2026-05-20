'use client'

import { Button } from '@/components/ui/button'
import { SheetFooter } from '@/components/ui/sheet'
import { formButtonClass } from '@/components/ui/form-controls'
import {
  isCollectionOrPaymentKind,
  isSaleOrPurchaseKind,
} from '@/lib/movements/operation-kind'
import type { OperationKind } from '@/lib/validations/movement'
import { cn } from '@/lib/utils'

const footerBtn = cn(
  formButtonClass,
  'h-10 w-full min-w-0 px-3 text-sm font-medium sm:px-4'
)

export interface MovementFormFooterProps {
  isGuidedCreate: boolean
  isLoading: boolean
  isEditing: boolean
  isRejectedCorrection: boolean
  accountsEmpty: boolean
  type: string
  operationKind: OperationKind
  accountId: string
  categoryId: string
  contactId: string
  sumMatchesComponents: boolean
  onClose: () => void
  onSubmit: (asDraft: boolean) => void
}

export function MovementFormFooter({
  isGuidedCreate,
  isLoading,
  isEditing,
  isRejectedCorrection,
  accountsEmpty,
  type,
  operationKind,
  accountId,
  categoryId,
  contactId,
  sumMatchesComponents,
  onClose,
  onSubmit,
}: MovementFormFooterProps) {
  const needsIncomeExpenseFields = type === 'income' || type === 'expense'
  const needsCategory =
    needsIncomeExpenseFields && isSaleOrPurchaseKind(operationKind)
  const needsContact =
    needsIncomeExpenseFields && isCollectionOrPaymentKind(operationKind)
  const submitDisabled =
    isLoading ||
    accountsEmpty ||
    (needsIncomeExpenseFields &&
      (!accountId ||
        !sumMatchesComponents ||
        (needsCategory && !categoryId) ||
        (needsContact && !contactId)))

  const primaryText = isLoading
    ? 'Guardando...'
    : isRejectedCorrection
      ? 'Corregir y reenviar'
      : isEditing
        ? 'Guardar cambios'
        : 'Enviar a aprobación'

  const showDraft = !isEditing && !isRejectedCorrection

  return (
    <SheetFooter
      className={cn(
        'mt-auto shrink-0 w-full border-t bg-muted/50 px-4 py-3',
        '!flex-none grid gap-2',
        isEditing || isRejectedCorrection
          ? 'grid-cols-2'
          : 'grid-cols-2 sm:grid-cols-3',
        isGuidedCreate ? 'sm:px-4' : 'sm:px-6'
      )}
    >
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isLoading}
        className={cn(footerBtn, !isEditing && showDraft && 'sm:order-1')}
      >
        Cancelar
      </Button>

      {showDraft ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => onSubmit(true)}
          disabled={isLoading || accountsEmpty}
          className={cn(footerBtn, 'sm:order-2')}
        >
          Borrador
        </Button>
      ) : null}

      <Button
        type="button"
        onClick={() => onSubmit(false)}
        disabled={submitDisabled}
        className={cn(
          footerBtn,
          'bg-[#7B68EE] text-white hover:bg-[#7B68EE]/90',
          showDraft && 'col-span-2 sm:col-span-1 sm:order-3',
          (isEditing || isRejectedCorrection) && 'sm:order-2'
        )}
      >
        <span className="truncate">{primaryText}</span>
      </Button>
    </SheetFooter>
  )
}
