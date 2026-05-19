'use client'

import type { ComponentProps } from 'react'

import { formButtonClass } from '@/components/ui/form-control-styles'
import { Input, type InputProps } from '@/components/ui/input'
import { MoneyInput, type MoneyInputProps } from '@/components/ui/money-input'
import { SelectTrigger } from '@/components/ui/select'
import { cn } from '@/lib/utils'

/** Texto / fecha en formularios de producto (drawer, alta/edición). */
export function FormInput({ className, controlSize: _controlSize, ...props }: InputProps) {
  void _controlSize
  return <Input controlSize="form" className={className} {...props} />
}

/** Montos con separador de miles; valor canónico string (ver lib/utils/money-input). */
export function FormMoneyInput({
  className,
  controlSize: _controlSize,
  ...props
}: MoneyInputProps) {
  void _controlSize
  return <MoneyInput controlSize="form" className={className} {...props} />
}

/** Select en formularios: altura h-10 y ancho completo por defecto. */
export function FormSelectTrigger({
  size = 'form',
  className,
  ...props
}: ComponentProps<typeof SelectTrigger>) {
  return <SelectTrigger size={size} className={className} {...props} />
}

/** Botón segmentado / toggle en la misma fila que inputs (ej. modo de pago). */
export function formSegmentButtonClass(className?: string) {
  return cn(formButtonClass, className)
}

export { formButtonClass }
