'use client'

import { Button } from '@/components/ui/button'
import { FormField, formSegmentButtonClass } from '@/components/ui/form-controls'
import { MOVEMENT_GUIDED_FIELD_IDS } from '@/components/movements/movement-form.types'

type MovementPaymentModeFieldProps = {
  question: string
  singleLabel: string
  splitLabel?: string
  showPaymentSplit: boolean
  onPaymentModeChange: (split: boolean) => void
  disabled?: boolean
}

export function MovementPaymentModeField({
  question,
  singleLabel,
  splitLabel = 'Repartido en varias',
  showPaymentSplit,
  onPaymentModeChange,
  disabled,
}: MovementPaymentModeFieldProps) {
  return (
    <FormField label={question} htmlFor={MOVEMENT_GUIDED_FIELD_IDS.paymentModeSingle}>
      <div
        role="group"
        aria-label={question}
        className="grid grid-cols-2 gap-2"
      >
        <Button
          id={MOVEMENT_GUIDED_FIELD_IDS.paymentModeSingle}
          type="button"
          variant={showPaymentSplit ? 'outline' : 'default'}
          className={formSegmentButtonClass()}
          onClick={() => onPaymentModeChange(false)}
          disabled={disabled}
          aria-pressed={!showPaymentSplit}
        >
          {singleLabel}
        </Button>
        <Button
          id={MOVEMENT_GUIDED_FIELD_IDS.paymentModeSplit}
          type="button"
          variant={showPaymentSplit ? 'default' : 'outline'}
          className={formSegmentButtonClass()}
          onClick={() => onPaymentModeChange(true)}
          disabled={disabled}
          aria-pressed={showPaymentSplit}
        >
          {splitLabel}
        </Button>
      </div>
    </FormField>
  )
}
