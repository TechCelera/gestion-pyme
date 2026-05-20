import {
  ArrowDownLeft,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react'
import type { OperationKind } from '@/lib/validations/movement'
import { OperationKindEnum } from '@/lib/validations/movement'

/** Valores canónicos alineados a BD (`transactions.operation_kind`). */
export const OPERATION_KIND_VALUES = OperationKindEnum.options

/** Etiquetas de producto (español neutro). */
export const OPERATION_KIND_PRODUCT_LABELS: Record<OperationKind, string> = {
  sale: 'Venta',
  purchase: 'Compra',
  collection: 'Cobro',
  payment: 'Pago',
}

export const OPERATION_KIND_FORM_COPY: Record<
  OperationKind,
  { title: string; subtitle: string; submitLabel: string }
> = {
  sale: {
    title: 'Registrar venta',
    subtitle: 'Reconocé el ingreso; el cobro en caja puede ser ahora o después',
    submitLabel: 'Registrar venta',
  },
  purchase: {
    title: 'Registrar compra',
    subtitle: 'Reconocé el gasto; el pago puede ser ahora o después',
    submitLabel: 'Registrar compra',
  },
  collection: {
    title: 'Registrar cobro',
    subtitle: 'Entrada de dinero contra un cliente (no duplica la venta en resultados)',
    submitLabel: 'Registrar cobro',
  },
  payment: {
    title: 'Registrar pago',
    subtitle: 'Salida de dinero contra un proveedor (no duplica la compra en resultados)',
    submitLabel: 'Registrar pago',
  },
}

export type OperationCreateButtonVariant = 'income-primary' | 'income-outline' | 'expense-outline'

export type OperationCreateButtonConfig = {
  kind: OperationKind
  label: string
  variant: OperationCreateButtonVariant
  icon: LucideIcon
}

/** Botones de alta rápida en `/operaciones`. */
export const OPERATION_CREATE_BUTTONS: OperationCreateButtonConfig[] = [
  { kind: 'sale', label: 'Venta', variant: 'income-primary', icon: ArrowDownLeft },
  { kind: 'collection', label: 'Cobro', variant: 'income-outline', icon: ArrowDownLeft },
  { kind: 'purchase', label: 'Compra', variant: 'expense-outline', icon: ArrowUpRight },
  { kind: 'payment', label: 'Pago', variant: 'expense-outline', icon: ArrowUpRight },
]

export const OPERATION_CONTACT_HELP_COPY =
  'Registrá contra qué cliente o proveedor estás cobrando o pagando.'

export const OPERATION_CASH_DATE_HINT_COPY =
  'Con efectivo en General empresa solo podés elegir hoy o ayer.'

export function getOperationKindProductLabel(kind: OperationKind | string | null | undefined): string | null {
  if (!kind) return null
  return OPERATION_KIND_PRODUCT_LABELS[kind as OperationKind] ?? null
}
