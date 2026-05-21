#!/usr/bin/env node
/**
 * Repone cuentas y categorías mínimas por país (igual que seedCompanyDefaults en la app).
 * No crea clientes ni proveedores — eso lo carga el usuario.
 *
 * Uso: pnpm run seed:defaults
 *      pnpm run seed:defaults -- --company-id=<uuid>
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { loadDotenvFiles } from './load-dotenv.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
loadDotenvFiles(root)

const companyIdArg = process.argv.find((a) => a.startsWith('--company-id='))?.split('=')[1]

const COUNTRY_CONFIGS = {
  AR: {
    accounts: [
      { name: 'Caja', type: 'cash', currency: 'ARS' },
      { name: 'Cuenta Corriente', type: 'bank', currency: 'ARS' },
      { name: 'Cuenta de Ahorros', type: 'bank', currency: 'ARS' },
    ],
    categories: [
      { name: 'Ventas de Productos', type: 'income' },
      { name: 'Ventas de Servicios', type: 'income' },
      { name: 'Otros Ingresos', type: 'income' },
      { name: 'Costo de Mercadería', type: 'expense' },
      { name: 'Sueldos y Jornales', type: 'expense' },
      { name: 'Servicios Públicos', type: 'expense' },
      { name: 'Alquiler', type: 'expense' },
      { name: 'Publicidad y Marketing', type: 'expense' },
      { name: 'Transporte y Logística', type: 'expense' },
      { name: 'Intereses Bancarios', type: 'expense' },
      { name: 'Comisiones Bancarias', type: 'expense' },
    ],
  },
  CO: {
    accounts: [
      { name: 'Caja', type: 'cash', currency: 'COP' },
      { name: 'Cuenta Corriente', type: 'bank', currency: 'COP' },
      { name: 'Cuenta de Ahorros', type: 'bank', currency: 'COP' },
    ],
    categories: [
      { name: 'Ventas de Productos', type: 'income' },
      { name: 'Ventas de Servicios', type: 'income' },
      { name: 'Otros Ingresos', type: 'income' },
      { name: 'Costo de Mercadería', type: 'expense' },
      { name: 'Sueldos y Jornales', type: 'expense' },
      { name: 'Servicios Públicos', type: 'expense' },
      { name: 'Alquiler', type: 'expense' },
      { name: 'Publicidad y Marketing', type: 'expense' },
      { name: 'Transporte y Logística', type: 'expense' },
      { name: 'Intereses Bancarios', type: 'expense' },
      { name: 'Comisiones Bancarias', type: 'expense' },
    ],
  },
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seedCompany(companyId, country) {
  const config = COUNTRY_CONFIGS[country ?? 'AR'] ?? COUNTRY_CONFIGS.AR

  const { data: existingAccounts } = await admin
    .from('accounts')
    .select('name')
    .eq('company_id', companyId)
    .is('deleted_at', null)

  const { data: existingCategories } = await admin
    .from('categories')
    .select('name')
    .eq('company_id', companyId)
    .is('deleted_at', null)

  const accountNames = new Set((existingAccounts ?? []).map((a) => a.name))
  const categoryNames = new Set((existingCategories ?? []).map((c) => c.name))

  const accountsToInsert = config.accounts
    .filter((a) => !accountNames.has(a.name))
    .map((a) => ({ company_id: companyId, ...a, balance: 0 }))

  const categoriesToInsert = config.categories
    .filter((c) => !categoryNames.has(c.name))
    .map((c) => ({ company_id: companyId, name: c.name, type: c.type }))

  if (accountsToInsert.length > 0) {
    const { error } = await admin.from('accounts').insert(accountsToInsert)
    if (error) throw new Error(`cuentas: ${error.message}`)
  }

  if (categoriesToInsert.length > 0) {
    const { error } = await admin.from('categories').insert(categoriesToInsert)
    if (error) throw new Error(`categorías: ${error.message}`)
  }

  return {
    accountsCreated: accountsToInsert.length,
    categoriesCreated: categoriesToInsert.length,
  }
}

async function main() {
  let companies
  if (companyIdArg) {
    const { data, error } = await admin
      .from('companies')
      .select('id, name, country')
      .eq('id', companyIdArg)
      .maybeSingle()
    if (error || !data) throw new Error('Empresa no encontrada')
    companies = [data]
  } else {
    const { data, error } = await admin.from('companies').select('id, name, country')
    if (error) throw new Error(error.message)
    companies = data ?? []
  }

  let totalAcc = 0
  let totalCat = 0
  for (const co of companies) {
    const r = await seedCompany(co.id, co.country)
    totalAcc += r.accountsCreated
    totalCat += r.categoriesCreated
    console.log(
      `${co.name} (${co.country ?? 'AR'}): +${r.accountsCreated} cuentas, +${r.categoriesCreated} categorías`
    )
  }

  const { count: contactCount } = await admin
    .from('contacts')
    .select('*', { count: 'exact', head: true })

  console.log(`\nTotal: ${totalAcc} cuentas, ${totalCat} categorías (idempotente por nombre).`)
  console.log(`Contactos en BD: ${contactCount ?? 0} (la semilla no crea clientes ni proveedores).`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
