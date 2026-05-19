'use client'

import { Button } from '@/components/ui/button'
import { SheetFooter } from '@/components/ui/sheet'
import { MOVEMENT_FORM_CONTROL_H } from '@/components/movements/movement-form.constants'
import { cn } from '@/lib/utils'

const footerBtn = cn(MOVEMENT_FORM_CONTROL_H, 'w-full px-4')

export interface MovementFormFooterProps {
  isGuidedCreate: boolean
  isLoading: boolean
  isEditing: boolean
  isRejectedCorrection: boolean
  isAdmin: boolean
  accountsEmpty: boolean
  type: string
  accountId: string
  categoryId: string
  sumMatchesComponents: boolean
  submitLabel?: string
  onClose: () => void
  onSubmit: (asDraft: boolean, submitForReviewOnly?: boolean) => void
}

export function MovementFormFooter({
  isGuidedCreate,
  isLoading,
  isEditing,
  isRejectedCorrection,
  isAdmin,
  accountsEmpty,
  type,
  accountId,
  categoryId,
  sumMatchesComponents,
  submitLabel,
  onClose,
  onSubmit,
}: MovementFormFooterProps) {
  const needsIncomeExpenseFields = type === 'income' || type === 'expense'
  const submitDisabled =
    isLoading ||
    accountsEmpty ||
    (needsIncomeExpenseFields && (!accountId || !categoryId || !sumMatchesComponents))

  return (
    <SheetFooter
      className={
        isGuidedCreate
          ? 'shrink-0 flex-col-reverse gap-2 border-t bg-muted/50 px-4 py-3 sm:grid sm:grid-cols-3 sm:items-center sm:gap-2'
          : 'shrink-0 flex-col-reverse gap-2 border-t bg-muted/50 px-6 py-4 md:grid md:grid-cols-3 md:items-center md:gap-3'
      }
    >
      <Button variant="outline" onClick={onClose} disabled={isLoading} className={footerBtn}>
        Cancelar
      </Button>
      {!isEditing && (
        <Button
          variant="secondary"
          onClick={() => onSubmit(true)}
          disabled={isLoading || accountsEmpty}
          className={footerBtn}
        >
          Guardar Borrador
        </Button>
      )}
      {!isEditing && !isRejectedCorrection && isAdmin ? (
        <Button
          variant="outline"
          onClick={() => onSubmit(false, true)}
          disabled={submitDisabled}
          className={footerBtn}
        >
          Enviar a revisión
        </Button>
      ) : null}
      <Button
        onClick={() => onSubmit(false, false)}
        disabled={submitDisabled}
        className={cn(footerBtn, 'bg-[#7B68EE] hover:bg-[#7B68EE]/90')}
      >
        {isLoading
          ? 'Guardando...'
          : isRejectedCorrection
            ? 'Corregir y reenviar'
            : isEditing
              ? 'Guardar cambios'
              : isAdmin
                ? `${submitLabel ?? 'Registrar'} y aprobar`
                : 'Enviar a aprobación'}
      </Button>
    </SheetFooter>
  )
}
