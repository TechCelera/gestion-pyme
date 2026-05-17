'use client'

import type { ComponentProps } from 'react'

import { Input } from '@/components/ui/input'
import {
  formatMoneyInputFromCanonical,
  getMoneyFractionDigits,
  parseMoneyInputToCanonical,
} from '@/lib/utils/money-input'
import { cn } from '@/lib/utils'

export interface MoneyInputProps
  extends Omit<ComponentProps<typeof Input>, 'type' | 'value' | 'onChange' | 'inputMode'> {
  value: string
  onValueChange: (canonical: string) => void
  currency?: string
}

export function MoneyInput({
  value,
  onValueChange,
  currency,
  className,
  placeholder,
  ...props
}: MoneyInputProps) {
  const fractionDigits = getMoneyFractionDigits(currency)
  const display = formatMoneyInputFromCanonical(value, fractionDigits)
  const defaultPlaceholder = fractionDigits === 0 ? '0' : '0,00'

  return (
    <Input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder ?? defaultPlaceholder}
      value={display}
      onChange={(e) => onValueChange(parseMoneyInputToCanonical(e.target.value, fractionDigits))}
      className={cn('tabular-nums', className)}
      {...props}
    />
  )
}
