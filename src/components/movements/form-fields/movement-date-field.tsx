'use client'

import { FormField, FormInput } from '@/components/ui/form-controls'
import { OPERATION_CASH_DATE_HINT_COPY } from '@/lib/movements/movement-config'
import { MOVEMENT_GUIDED_FIELD_IDS } from '@/components/movements/movement-form.types'

type MovementDateFieldProps = {
  date: string
  onDateChange: (value: string) => void
  min?: string
  max?: string
  showCashHint?: boolean
  disabled?: boolean
}

export function MovementDateField({
  date,
  onDateChange,
  min,
  max,
  showCashHint,
  disabled,
}: MovementDateFieldProps) {
  return (
    <>
      <FormField label="¿Cuándo?" htmlFor={MOVEMENT_GUIDED_FIELD_IDS.date} alignControl>
        <FormInput
          id={MOVEMENT_GUIDED_FIELD_IDS.date}
          type="date"
          value={date}
          min={min}
          max={max}
          onChange={(e) => onDateChange(e.target.value)}
          disabled={disabled}
        />
      </FormField>
      {showCashHint ? (
        <p className="text-xs text-muted-foreground">{OPERATION_CASH_DATE_HINT_COPY}</p>
      ) : null}
    </>
  )
}
