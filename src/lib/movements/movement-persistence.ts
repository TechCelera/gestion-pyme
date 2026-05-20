import type { CreateMovementInput } from '@/lib/validations/movement'
import {
  contactTypeForOperationKind,
  requiresCategoryForKind,
  requiresContactForKind,
  resolveOperationKindForPersistence,
} from '@/lib/movements/operation-kind'

/** Campos de contacto/categoría coherentes con el subtipo antes de RPC. */
export function resolveIncomeExpensePersistenceFields(validated: {
  type: CreateMovementInput['type']
  operationKind?: CreateMovementInput['operationKind']
  categoryId?: string
  contactId?: string
  contactType?: CreateMovementInput['contactType']
}) {
  const operationKind = resolveOperationKindForPersistence(
    validated.operationKind,
    validated.type
  )

  return {
    operationKind,
    categoryId: requiresCategoryForKind(operationKind)
      ? (validated.categoryId ?? null)
      : null,
    contactId: requiresContactForKind(operationKind)
      ? (validated.contactId ?? null)
      : null,
    contactType: requiresContactForKind(operationKind)
      ? (contactTypeForOperationKind(operationKind) ?? validated.contactType ?? null)
      : null,
  }
}
