#!/usr/bin/env node
/**
 * Elimina todos los contactos (clientes/proveedores) y desvincula referencias.
 * Solo desarrollo / pruebas — requiere service_role.
 *
 * Uso: pnpm run wipe:contacts
 *      pnpm run wipe:contacts -- --dry-run
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { loadDotenvFiles } from './load-dotenv.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
loadDotenvFiles(root)

const dryRun = process.argv.includes('--dry-run')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function listContacts() {
  const { data, error } = await admin
    .from('contacts')
    .select('id, name, kind, phone, company_id, deleted_at')
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

async function unlinkTransactionsFromContacts(contactIds) {
  const { data: txns, error: fetchErr } = await admin
    .from('transactions')
    .select('id, operation_kind, status, description')
    .in('contact_id', contactIds)
    .is('deleted_at', null)
  if (fetchErr) throw new Error(`transactions list: ${fetchErr.message}`)
  const ids = (txns ?? []).map((t) => t.id)
  if (ids.length === 0) {
    console.log('  (sin movimientos activos con contact_id)')
    return
  }
  console.log(`  movimientos a desvincular: ${ids.length}`)
  for (const t of txns ?? []) {
    console.log(
      `    - [${t.status}] ${t.operation_kind ?? '?'} ${t.description?.slice(0, 40) ?? t.id}`
    )
  }
  // Cobro/pago publicados exigen contacto: anular primero para poder quitar contact_id
  const { error: cancelErr } = await admin
    .from('transactions')
    .update({ status: 'cancelled' })
    .in('id', ids)
  if (cancelErr) throw new Error(`transactions cancel: ${cancelErr.message}`)
  const { error: nullErr } = await admin
    .from('transactions')
    .update({ contact_id: null })
    .in('id', ids)
  if (nullErr) throw new Error(`transactions contact_id: ${nullErr.message}`)
  console.log('  ✓ movimientos anulados y desvinculados del contacto')
}

async function clearContactRefs(contactIds) {
  if (contactIds.length === 0) return

  console.log('Desvinculando movimientos (cobro/pago exigen contacto si están activos)…')
  await unlinkTransactionsFromContacts(contactIds)

  const steps = [
    {
      label: 'journal_entry_lines.contact_id',
      run: () =>
        admin
          .from('journal_entry_lines')
          .update({ contact_id: null })
          .in('contact_id', contactIds),
    },
    {
      label: 'operation_components.contact_id',
      run: () =>
        admin
          .from('operation_components')
          .update({ contact_id: null })
          .in('contact_id', contactIds),
    },
  ]

  for (const step of steps) {
    const { error } = await step.run()
    if (error) throw new Error(`${step.label}: ${error.message}`)
    console.log(`  ✓ ${step.label} → null`)
  }
}

async function deleteContacts(contactIds) {
  if (contactIds.length === 0) return
  const { error } = await admin.from('contacts').delete().in('id', contactIds)
  if (error) throw new Error(`contacts delete: ${error.message}`)
}

async function main() {
  const before = await listContacts()
  const active = before.filter((c) => !c.deleted_at)
  console.log(`Contactos en BD: ${before.length} (${active.length} activos)`)
  for (const c of before) {
    console.log(`  - [${c.kind}] ${c.name}${c.phone ? ` (${c.phone})` : ''}`)
  }

  if (before.length === 0) {
    console.log('Nada que borrar.')
    return
  }

  if (dryRun) {
    console.log('\n--dry-run: no se modificó la BD.')
    return
  }

  const ids = before.map((c) => c.id)
  console.log('\nDesvinculando movimientos y asientos…')
  await clearContactRefs(ids)

  console.log('Eliminando contactos…')
  await deleteContacts(ids)

  const after = await listContacts()
  console.log(`\nListo. Contactos restantes: ${after.length}`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
