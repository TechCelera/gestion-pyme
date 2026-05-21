import type { ContactRow } from '@/lib/actions/contacts'
import type { ContactKind } from '@/lib/validations/contact'

/** Listado pantalla Clientes (incluye legacy `both`). */
export function filterContactsForClients(contacts: ContactRow[]): ContactRow[] {
  return contacts.filter((c) => c.kind === 'client' || c.kind === 'both')
}

/** Listado pantalla Proveedores (incluye legacy `both`). */
export function filterContactsForProviders(contacts: ContactRow[]): ContactRow[] {
  return contacts.filter((c) => c.kind === 'provider' || c.kind === 'both')
}

/** Selector en cobro / venta a cliente. */
export function filterContactsForIncomeOperations(contacts: ContactRow[]): ContactRow[] {
  return contacts.filter((c) => c.kind === 'client' || c.kind === 'both')
}

/** Selector en pago / compra a proveedor. */
export function filterContactsForExpenseOperations(contacts: ContactRow[]): ContactRow[] {
  return contacts.filter((c) => c.kind === 'provider' || c.kind === 'both')
}

export function contactKindLabel(kind: ContactRow['kind']): string {
  if (kind === 'client') return 'Cliente'
  if (kind === 'provider') return 'Proveedor'
  return 'Cliente y proveedor'
}

export function fixedKindForPage(kind: ContactKind): ContactKind {
  return kind
}
