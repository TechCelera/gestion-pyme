import { cn } from '@/lib/utils'
import type { OperationCreateButtonVariant } from '@/lib/movements/movement-config'

/** Botones de alta rápida en fila: reparten el ancho disponible. */
export const OPERATION_CREATE_ROW_BUTTON_CLASS =
  'h-10 min-w-0 flex-1 px-1.5 sm:px-2'

export function operationCreateButtonClassName(variant: OperationCreateButtonVariant): string {
  switch (variant) {
    case 'income-primary':
      return cn(OPERATION_CREATE_ROW_BUTTON_CLASS, 'bg-green-600 hover:bg-green-600/90')
    case 'income-outline':
      return cn(
        OPERATION_CREATE_ROW_BUTTON_CLASS,
        'border-green-200 text-green-800 hover:bg-green-50 dark:border-green-900 dark:text-green-300'
      )
    case 'expense-outline':
      return cn(
        OPERATION_CREATE_ROW_BUTTON_CLASS,
        'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40'
      )
    default:
      return OPERATION_CREATE_ROW_BUTTON_CLASS
  }
}

export function operationCreateIconClassName(variant: OperationCreateButtonVariant): string {
  return variant === 'income-outline' || variant === 'expense-outline'
    ? 'h-4 w-4 shrink-0 sm:mr-1.5 opacity-70'
    : 'h-4 w-4 shrink-0 sm:mr-1.5'
}
