#!/usr/bin/env node
/**
 * Tenant demo Matías Distribuidora: usuario, empresa distribuidora, contactos y movimientos.
 *
 * Uso:
 *   pnpm run seed:matias-demo
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *   DEMO_EMAIL, DEMO_PASSWORD
 *   NEXT_PUBLIC_DEMO_LOGIN_ENABLED=1
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { loadDotenvFiles } from './load-dotenv.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
loadDotenvFiles(root)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const demoEmail = (process.env.DEMO_EMAIL ?? 'matias-demo@gestion-pyme.app').trim().toLowerCase()
const demoPassword = (process.env.DEMO_PASSWORD ?? 'DemoMatias2026!').trim()

const DISTRIBUIDORA_CATEGORIES = [
  { name: 'Compra mercadería', type: 'expense' },
  { name: 'Flete', type: 'expense' },
  { name: 'Peones y jornales', type: 'expense' },
  { name: 'Combustible', type: 'expense' },
  { name: 'Gastos de mercado', type: 'expense' },
]

const DEMO_CLIENTS = [
  { name: 'Verdulería El Progreso', tax_id: '30-71234567-8' },
  { name: 'Dietética San Martín', tax_id: '30-70987654-3' },
  { name: 'Autoservicio Rivadavia', tax_id: '30-70112233-4' },
]

const DEMO_SUPPLIERS = [
  { name: 'Mayorista Mercofus', tax_id: '30-70001122-1' },
  { name: 'Productor Liniers', tax_id: '20-25456789-6' },
]

if (!url || !anonKey || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL, ANON_KEY o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

async function findUserByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (error) throw new Error(error.message)
  return (data.users ?? []).find((u) => (u.email ?? '').toLowerCase() === email) ?? null
}

async function ensureDemoUser() {
  let user = await findUserByEmail(demoEmail)
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Matías (Demo)',
        company_name: 'Matías Distribuidora',
        country: 'AR',
        operating_profile: 'distribuidora',
      },
    })
    if (error) throw new Error(`crear usuario: ${error.message}`)
    user = data.user
    console.log('Usuario demo creado:', demoEmail)
  } else {
    await admin.auth.admin.updateUserById(user.id, {
      password: demoPassword,
      user_metadata: {
        ...user.user_metadata,
        full_name: 'Matías (Demo)',
        company_name: 'Matías Distribuidora',
        country: 'AR',
        operating_profile: 'distribuidora',
      },
    })
    console.log('Usuario demo existente:', demoEmail)
  }
  return user
}

async function getCompanyIdForUser(userId) {
  const { data, error } = await admin.from('users').select('company_id').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data?.company_id) throw new Error('Usuario sin empresa — revisá trigger handle_new_user')
  return data.company_id
}

async function ensureDistribuidoraCompany(companyId) {
  const { error } = await admin
    .from('companies')
    .update({ name: 'Matías Distribuidora', country: 'AR', currency: 'ARS', operating_profile: 'distribuidora' })
    .eq('id', companyId)
  if (error) throw new Error(error.message)
}

async function bootstrapOperational(companyId) {
  const { error } = await admin.rpc('fn_bootstrap_company_operational', {
    p_company_id: companyId,
    p_country: 'AR',
  })
  if (error) throw new Error(`bootstrap: ${error.message}`)
}

async function seedDistribuidoraCategories(companyId) {
  const { data: existing } = await admin
    .from('categories')
    .select('name')
    .eq('company_id', companyId)
    .is('deleted_at', null)
  const names = new Set((existing ?? []).map((c) => c.name))
  const toInsert = DISTRIBUIDORA_CATEGORIES.filter((c) => !names.has(c.name)).map((c) => ({
    company_id: companyId,
    name: c.name,
    type: c.type,
  }))
  if (toInsert.length > 0) {
    const { error } = await admin.from('categories').insert(toInsert)
    if (error) throw new Error(error.message)
  }
}

async function seedContacts(companyId) {
  const { data: existing } = await admin
    .from('contacts')
    .select('name, type')
    .eq('company_id', companyId)
    .is('deleted_at', null)
  const keys = new Set((existing ?? []).map((c) => `${c.type}:${c.name}`))

  const rows = [
    ...DEMO_CLIENTS.map((c) => ({
      company_id: companyId,
      name: c.name,
      type: 'cliente',
      tax_id: c.tax_id,
    })),
    ...DEMO_SUPPLIERS.map((c) => ({
      company_id: companyId,
      name: c.name,
      type: 'proveedor',
      tax_id: c.tax_id,
    })),
  ].filter((r) => !keys.has(`${r.type}:${r.name}`))

  if (rows.length > 0) {
    const { error } = await admin.from('contacts').insert(rows)
    if (error) throw new Error(error.message)
  }
}

async function lookupId(table, companyId, filters) {
  let q = admin.from(table).select('id').eq('company_id', companyId).is('deleted_at', null)
  for (const [k, v] of Object.entries(filters)) {
    q = q.eq(k, v)
  }
  const { data, error } = await q.maybeSingle()
  if (error) throw new Error(error.message)
  return data?.id ?? null
}

async function approveMovement(client, txId) {
  for (const status of ['pending', 'approved']) {
    const { error } = await client.rpc('update_transaction_status', {
      p_transaction_id: txId,
      p_new_status: status,
    })
    if (error) throw new Error(`${status}: ${error.message}`)
  }
}

async function createCashMovement(client, companyId, ids, spec) {
  const { data: txId, error } = await client.rpc('create_transaction', {
    p_company_id: companyId,
    p_account_id: ids.caja,
    p_type: spec.type,
    p_amount: spec.amount,
    p_date: spec.date,
    p_description: spec.description,
    p_category_id: spec.categoryId,
    p_method: 'cash',
    p_currency: 'ARS',
    p_exchange_rate: 1,
    p_contact_id: spec.contactId ?? null,
    p_contact_type: spec.contactType ?? null,
    p_operation_kind: spec.kind,
  })
  if (error) throw new Error(error.message)

  const { error: cmpError } = await client.rpc('set_operation_components', {
    p_transaction_id: txId,
    p_components: [
      {
        component_type: 'operative_cash',
        account_id: ids.caja,
        contact_id: null,
        amount: spec.amount,
        currency: 'ARS',
      },
    ],
  })
  if (cmpError) throw new Error(cmpError.message)

  await approveMovement(client, txId)
  return txId
}

async function seedMovements(companyId, userId) {
  const { count } = await admin
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .is('deleted_at', null)

  if ((count ?? 0) >= 5) {
    console.log(`Movimientos existentes (${count}) — omitiendo seed`)
    return
  }

  const ids = {
    caja: await lookupId('accounts', companyId, { name: 'Caja' }),
    ventas: await lookupId('categories', companyId, { name: 'Ventas de Productos' }),
    cmv: await lookupId('categories', companyId, { name: 'Compra mercadería' }),
    flete: await lookupId('categories', companyId, { name: 'Flete' }),
    combustible: await lookupId('categories', companyId, { name: 'Combustible' }),
    cliente1: await lookupId('contacts', companyId, { name: DEMO_CLIENTS[0].name, type: 'cliente' }),
    proveedor1: await lookupId('contacts', companyId, { name: DEMO_SUPPLIERS[0].name, type: 'proveedor' }),
  }

  if (!ids.caja || !ids.ventas || !ids.cmv) {
    throw new Error('Faltan cuentas/categorías base — corré bootstrap primero')
  }

  const userClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: signInError } = await userClient.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword,
  })
  if (signInError) throw new Error(`login demo: ${signInError.message}`)

  const specs = [
    {
      type: 'income',
      kind: 'sale',
      amount: 85000,
      date: daysAgo(2),
      description: 'Venta verduras — El Progreso',
      categoryId: ids.ventas,
      contactId: ids.cliente1,
      contactType: 'cliente',
    },
    {
      type: 'income',
      kind: 'sale',
      amount: 120000,
      date: daysAgo(1),
      description: 'Venta frutas — San Martín',
      categoryId: ids.ventas,
    },
    {
      type: 'expense',
      kind: 'purchase',
      amount: 45000,
      date: daysAgo(2),
      description: 'Compra mercadería — Mercofus',
      categoryId: ids.cmv,
      contactId: ids.proveedor1,
      contactType: 'proveedor',
    },
    {
      type: 'expense',
      kind: 'purchase',
      amount: 8500,
      date: daysAgo(1),
      description: 'Flete zona sur',
      categoryId: ids.flete ?? ids.cmv,
    },
    {
      type: 'expense',
      kind: 'purchase',
      amount: 3200,
      date: daysAgo(0),
      description: 'Combustible camioneta',
      categoryId: ids.combustible ?? ids.cmv,
    },
  ]

  for (const spec of specs) {
    await createCashMovement(userClient, companyId, ids, spec)
  }

  console.log(`+${specs.length} movimientos demo (aprobados)`)
  void userId
}

async function main() {
  const user = await ensureDemoUser()
  const companyId = await getCompanyIdForUser(user.id)
  await ensureDistribuidoraCompany(companyId)
  await bootstrapOperational(companyId)
  await seedDistribuidoraCategories(companyId)
  await seedContacts(companyId)
  await seedMovements(companyId, user.id)

  console.log('')
  console.log('Demo lista:')
  console.log(`  URL:   ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://gestion-pyme-gamma.vercel.app'}/login`)
  console.log(`  Email: ${demoEmail}`)
  console.log(`  Pass:  ${demoPassword}`)
  console.log('')
  console.log('Variables .env.local sugeridas:')
  console.log('  NEXT_PUBLIC_DEMO_LOGIN_ENABLED=1')
  console.log(`  NEXT_PUBLIC_DEMO_EMAIL=${demoEmail}`)
  console.log(`  NEXT_PUBLIC_DEMO_PASSWORD=${demoPassword}`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
