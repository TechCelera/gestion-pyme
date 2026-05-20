'use client'

import {
  FormField,
  FormMoneyInput,
  FormSelectTrigger,
} from '@/components/ui/form-controls'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { MOVEMENT_CURRENCIES } from '@/components/movements/movement-form.constants'
import { MOVEMENT_GUIDED_FIELD_IDS } from '@/components/movements/movement-form.types'

type MovementAmountCurrencyFieldsProps = {
  amount: string
  onAmountChange: (value: string) => void
  currency: string
  onCurrencyChange: (value: string) => void
  disabled?: boolean
}

export function MovementAmountCurrencyFields({
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  disabled,
}: MovementAmountCurrencyFieldsProps) {
  return (
    <div className="grid grid-cols-[1fr,5.25rem] gap-2.5">
      <FormField label="¿Cuánto?" htmlFor={MOVEMENT_GUIDED_FIELD_IDS.amount} alignControl>
        <FormMoneyInput
          id={MOVEMENT_GUIDED_FIELD_IDS.amount}
          value={amount}
          onValueChange={onAmountChange}
          currency={currency}
          disabled={disabled}
          className="text-lg font-medium"
        />
      </FormField>
      <FormField label="Moneda" htmlFor={MOVEMENT_GUIDED_FIELD_IDS.currency} alignControl>
        <Select
          value={currency}
          onValueChange={(value) => onCurrencyChange(value ?? 'ARS')}
          disabled={disabled}
        >
          <FormSelectTrigger id={MOVEMENT_GUIDED_FIELD_IDS.currency}>
            <SelectValue>
              {MOVEMENT_CURRENCIES.find((c) => c.value === currency)?.value ?? currency}
            </SelectValue>
          </FormSelectTrigger>
          <SelectContent>
            {MOVEMENT_CURRENCIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.flag} {c.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>
  )
}
