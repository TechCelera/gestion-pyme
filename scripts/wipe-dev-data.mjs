#!/usr/bin/env node
/**
 * Tablero operativo en cero: movimientos, contactos, cuentas y categorías.
 * Requiere migración 20260520180000_dev_wipe_operational_data_rpc.sql aplicada (pnpm sb:push).
 *
 * Uso: pnpm run wipe:dev
 *      pnpm run wipe:dev -- --dry-run
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

async function countTable(table) {
  const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true })
  if (error) throw new Error(`${table}: ${error.message}`)
  return count ?? 0
}

async function listSample(table, select, limit = 8) {
  const { data, error } = await admin.from(table).select(select).limit(limit)
  if (error) throw new Error(`${table}: ${error.message}`)
  return data ?? []
}

async function main() {
  console.log('Estado actual (aprox.):')
  const [tx, ct, acc, cat] = await Promise.all([
    countTable('transactions'),
    countTable('contacts'),
    countTable('accounts'),
    countTable('categories'),
  ])
  console.log(`  movimientos: ${tx}`)
  console.log(`  contactos:   ${ct}`)
  console.log(`  cuentas:     ${acc}`)
  console.log(`  categorías:  ${cat}`)

  const e2eAccounts = await admin
    .from('accounts')
    .select('name')
    .ilike('name', 'E2E%')
  const e2eContacts = await admin
    .from('contacts')
    .select('name, kind')
    .or('name.ilike.E2E%,name.ilike.%E2E %')
  if ((e2eAccounts.data ?? []).length) {
    console.log('  cuentas E2E:', e2eAccounts.data.map((a) => a.name).join(', '))
  }
  if ((e2eContacts.data ?? []).length) {
    console.log(
      '  contactos E2E:',
      e2eContacts.data.map((c) => `${c.name} (${c.kind})`).join(', ')
    )
  }

  const sampleTx = await listSample('transactions', 'description, status, operation_kind', 5)
  for (const t of sampleTx) {
    console.log(`    · [${t.status}] ${t.operation_kind ?? '?'} ${(t.description ?? '').slice(0, 50)}`)
  }

  if (dryRun) {
    console.log('\n--dry-run: no se modificó la BD.')
    console.log('Sin esto, se ejecuta dev_wipe_operational_data (todo el tablero operativo).')
    return
  }

  console.log('\nEjecutando dev_wipe_operational_data…')
  const { data, error } = await admin.rpc('dev_wipe_operational_data')
  if (error) {
    if (error.message?.includes('dev_wipe_operational_data')) {
      console.error(
        '\nLa función no existe en remoto. Aplicá la migración:\n  pnpm sb:push:dry && pnpm sb:push\n'
      )
    }
    throw new Error(error.message)
  }

  console.log('Eliminado:', data)

  const [tx2, ct2, acc2, cat2] = await Promise.all([
    countTable('transactions'),
    countTable('contacts'),
    countTable('accounts'),
    countTable('categories'),
  ])
  console.log('\nRestante:')
  console.log(`  movimientos: ${tx2}`)
  console.log(`  contactos:   ${ct2}`)
  console.log(`  cuentas:     ${acc2}`)
  console.log(`  categorías:  ${cat2}`)
  console.log('\nSiguiente paso (mínimo operativo, sin contactos):')
  console.log('  pnpm run seed:defaults')
  console.log('O entrá al dashboard (SeedOnFirstAccess hace lo mismo por sesión).')
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
