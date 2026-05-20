'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { FormSelectTrigger } from '@/components/ui/form-primitives'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'

export type FormCreatableSelectOption = {
  value: string
  label: string
}

export type FormCreatableSelectProps = {
  label: ReactNode
  htmlFor?: string
  value: string
  onValueChange: (value: string) => void
  options: FormCreatableSelectOption[]
  placeholder?: string
  selectedLabel?: string
  hint?: ReactNode
  disabled?: boolean
  isLoading?: boolean
  alignControl?: boolean
  onCreateNew?: () => void
  createNewLabel?: string
  emptyCreateLabel?: string
  /** Lista vacía sin diálogo inline: enlace a pantalla de alta (cuentas, categorías). */
  emptySetupLink?: {
    href: string
    label: string
    onNavigate?: () => void
    message?: string
  }
  className?: string
}

/** Select de formulario con acción opcional para crear ítem si no existe en la lista. */
export function FormCreatableSelect({
  label,
  htmlFor,
  value,
  onValueChange,
  options,
  placeholder = 'Elegí una opción',
  selectedLabel,
  hint,
  disabled = false,
  isLoading = false,
  alignControl = false,
  onCreateNew,
  createNewLabel = '+ Nuevo',
  emptyCreateLabel,
  emptySetupLink,
  className,
}: FormCreatableSelectProps) {
  const displayLabel = selectedLabel || options.find((o) => o.value === value)?.label || ''
  const showEmptyCreate = !isLoading && options.length === 0 && !!onCreateNew
  const showEmptyLink = !isLoading && options.length === 0 && !onCreateNew && !!emptySetupLink

  const labelNode =
    onCreateNew && !showEmptyCreate && !showEmptyLink ? (
      <span className="flex w-full items-center justify-between gap-2">
        <span>{label}</span>
        <Button
          type="button"
          variant="ghost"
          className="h-8 shrink-0 px-2 text-xs font-medium text-[#7B68EE] hover:text-[#7B68EE]/90"
          onClick={onCreateNew}
          disabled={disabled || isLoading}
        >
          {createNewLabel}
        </Button>
      </span>
    ) : (
      label
    )

  return (
    <FormField
      label={labelNode}
      htmlFor={htmlFor}
      hint={hint}
      alignControl={alignControl}
      className={className}
    >
      {showEmptyCreate ? (
        <div className="flex h-10 min-h-10 w-full items-center justify-center rounded-lg border border-dashed px-2 text-center text-xs text-muted-foreground">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs font-medium text-[#7B68EE]"
            onClick={onCreateNew}
            disabled={disabled}
          >
            {emptyCreateLabel ?? createNewLabel}
          </Button>
        </div>
      ) : showEmptyLink ? (
        <div className="flex min-h-10 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-2 py-2 text-center text-xs text-muted-foreground">
          {emptySetupLink.message ? <span>{emptySetupLink.message}</span> : null}
          <Link
            href={emptySetupLink.href}
            onClick={emptySetupLink.onNavigate}
            className="font-medium text-[#7B68EE] hover:underline"
          >
            {emptySetupLink.label}
          </Link>
        </div>
      ) : (
        <Select
          value={value || undefined}
          onValueChange={(v) => onValueChange(v ?? '')}
          disabled={disabled || isLoading}
        >
          <FormSelectTrigger id={htmlFor} className="w-full max-w-none">
            <SelectValue>
              <span className="block truncate" title={displayLabel}>
                {displayLabel || placeholder}
              </span>
            </SelectValue>
          </FormSelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  )
}
