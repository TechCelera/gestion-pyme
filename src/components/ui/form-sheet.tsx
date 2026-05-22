'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFormBody,
  SheetFormFooter,
  SheetFormHeader,
  SheetTitle,
  sheetFormContentClass,
  sheetFormFieldsClass,
} from '@/components/ui/sheet'
import { Button, type ButtonProps } from '@/components/ui/button'
import { formButtonClass } from '@/components/ui/form-controls'
import { cn } from '@/lib/utils'

type FormSheetMaxWidth = 'md' | 'lg'
type FormSheetSubmitTone = 'accent' | 'primary'

/** Botones del pie del drawer: altura h-10, ancho completo en la celda del grid. */
const formSheetFooterButtonClass = cn(
  formButtonClass,
  'h-10 w-full min-w-0 px-3 text-sm font-medium sm:px-4'
)

const formSheetFooterLayoutClass = 'grid w-full grid-cols-2 gap-2'

const formSheetAccentSubmitClass =
  'bg-[#7B68EE] text-white hover:bg-[#7B68EE]/90 focus-visible:ring-[#7B68EE]/30'

const formSheetMaxWidthClass: Record<FormSheetMaxWidth, string> = {
  md: 'data-[side=right]:sm:max-w-md',
  lg: 'data-[side=right]:sm:max-w-lg',
}

type FormSheetProps = {
  open: boolean
  /** Se llama al cerrar (overlay, Escape, botón X o `onOpenChange(false)`). */
  onClose: () => void
  maxWidth?: FormSheetMaxWidth
  side?: 'top' | 'right' | 'bottom' | 'left'
  contentClassName?: string
  children: React.ReactNode
}

function FormSheet({
  open,
  onClose,
  maxWidth = 'lg',
  side = 'right',
  contentClassName,
  children,
}: FormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side={side}
        className={cn(sheetFormContentClass, formSheetMaxWidthClass[maxWidth], contentClassName)}
      >
        {children}
      </SheetContent>
    </Sheet>
  )
}

type FormSheetHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

function FormSheetHeader({ title, description, className, children }: FormSheetHeaderProps) {
  return (
    <SheetFormHeader className={className}>
      <SheetTitle className="text-lg">{title}</SheetTitle>
      {description ? <SheetDescription>{description}</SheetDescription> : null}
      {children}
    </SheetFormHeader>
  )
}

type FormSheetBodyProps = React.ComponentProps<'div'> & {
  /** Envuelve hijos en `sheetFormFieldsClass` (espaciado entre campos). */
  wrapFields?: boolean
  fieldsClassName?: string
}

function FormSheetBody({
  className,
  wrapFields = true,
  fieldsClassName,
  children,
  ...props
}: FormSheetBodyProps) {
  return (
    <SheetFormBody className={className} {...props}>
      {wrapFields ? (
        <div className={cn(sheetFormFieldsClass, fieldsClassName)}>{children}</div>
      ) : (
        children
      )}
    </SheetFormBody>
  )
}

function FormSheetFooter({
  className,
  children,
  columns = 2,
  ...props
}: React.ComponentProps<typeof SheetFormFooter> & {
  /** Columnas del grid del pie (2 = cancelar + guardar; 3 = + borrador). */
  columns?: 2 | 3
}) {
  return (
    <SheetFormFooter
      className={cn(
        formSheetFooterLayoutClass,
        columns === 3 && 'sm:grid-cols-3',
        className
      )}
      {...props}
    >
      {children}
    </SheetFormFooter>
  )
}

function FormSheetCancelButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(formSheetFooterButtonClass, className)}
      {...props}
    >
      {children}
    </Button>
  )
}

type FormSheetSubmitButtonProps = ButtonProps & {
  isLoading?: boolean
  tone?: FormSheetSubmitTone
}

function FormSheetSubmitButton({
  className,
  children,
  isLoading = false,
  tone = 'accent',
  disabled,
  ...props
}: FormSheetSubmitButtonProps) {
  return (
    <Button
      type="button"
      variant={tone === 'primary' ? 'default' : undefined}
      disabled={disabled || isLoading}
      className={cn(
        formSheetFooterButtonClass,
        tone === 'accent' && formSheetAccentSubmitClass,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="truncate">Guardando...</span>
        </>
      ) : (
        <span className="truncate">{children}</span>
      )}
    </Button>
  )
}

type FormSheetActionsProps = {
  onCancel: () => void
  onSubmit: () => void
  cancelLabel?: string
  submitLabel: React.ReactNode
  isSaving?: boolean
  submitDisabled?: boolean
  submitTone?: FormSheetSubmitTone
  footerClassName?: string
}

function FormSheetActions({
  onCancel,
  onSubmit,
  cancelLabel = 'Cancelar',
  submitLabel,
  isSaving = false,
  submitDisabled = false,
  submitTone = 'accent',
  footerClassName,
}: FormSheetActionsProps) {
  return (
    <FormSheetFooter className={footerClassName}>
      <FormSheetCancelButton onClick={onCancel} disabled={isSaving}>
        {cancelLabel}
      </FormSheetCancelButton>
      <FormSheetSubmitButton
        onClick={onSubmit}
        isLoading={isSaving}
        disabled={submitDisabled}
        tone={submitTone}
      >
        {submitLabel}
      </FormSheetSubmitButton>
    </FormSheetFooter>
  )
}

export {
  FormSheet,
  FormSheetHeader,
  FormSheetBody,
  FormSheetFooter,
  FormSheetCancelButton,
  FormSheetSubmitButton,
  FormSheetActions,
  formSheetFooterButtonClass,
  formSheetAccentSubmitClass,
  sheetFormFieldsClass,
}
