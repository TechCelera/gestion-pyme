import {
  isCollectionOrPaymentKind,
  isSaleOrPurchaseKind,
} from '@/lib/movements/operation-kind'
import { getOperationKindProductLabel } from '@/lib/movements/movement-config'
import type { OperationKind } from '@/lib/validations/movement'

export function shouldShowCategoryInDetail(
  operationKind: OperationKind | null | undefined
): boolean {
  return isSaleOrPurchaseKind(operationKind)
}

export function shouldShowContactInDetail(
  operationKind: OperationKind | null | undefined,
  contactId: string | null | undefined
): boolean {
  return isCollectionOrPaymentKind(operationKind) || Boolean(contactId)
}

export function contactFieldLabel(
  operationKind: OperationKind | null | undefined
): string {
  if (operationKind === 'collection') return 'Cliente'
  if (operationKind === 'payment') return 'Proveedor'
  return 'Contacto'
}

export function categoryDetailValue(
  operationKind: OperationKind | null | undefined,
  categoryName: string | null | undefined
): string {
  if (isCollectionOrPaymentKind(operationKind)) {
    return 'No aplica (cobro o pago)'
  }
  return categoryName?.trim() || '—'
}

export function operationKindDetailLabel(
  operationKind: OperationKind | null | undefined
): string | null {
  if (!operationKind) return null
  return getOperationKindProductLabel(operationKind)
}

export function resolveDisplayedContactName(input: {
  contactId?: string | null
  contactName?: string | null
  contacts: { id: string; name: string }[]
}): string | null {
  const { contactId, contactName, contacts } = input
  if (!contactId) return null
  const trimmed = contactName?.trim()
  if (trimmed) return trimmed
  return contacts.find((c) => c.id === contactId)?.name ?? null
}
