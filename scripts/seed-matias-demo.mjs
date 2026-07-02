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
const operatorEmail = (
  process.env.DEMO_OPERATOR_EMAIL ?? 'operador-matias-demo@gestion-pyme.app'
).trim().toLowerCase()
const operatorPassword = (process.env.DEMO_OPERATOR_PASSWORD ?? demoPassword).trim()

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

async function ensureOperatorInvite(companyId, invitedBy) {
  const token = 'matias-demo-operator'
  const { error } = await admin.from('company_invites').upsert(
    {
      company_id: companyId,
      email: operatorEmail,
      full_name: 'Operador Administrativo (Demo)',
      role: 'collaborator',
      token,
      invited_by: invitedBy,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      accepted_at: null,
    },
    { onConflict: 'token' }
  )
  if (error) throw new Error(`invite operador: ${error.message}`)
  return token
}

async function ensureOperatorUser(companyId, invitedBy) {
  let user = await findUserByEmail(operatorEmail)
  const appMetadata = {
    company_id: companyId,
    role: 'collaborator',
    is_active: true,
    country: 'AR',
  }
  const userMetadata = {
    full_name: 'Operador Administrativo (Demo)',
    company_name: 'Matías Distribuidora',
    country: 'AR',
  }

  if (!user) {
    const inviteToken = await ensureOperatorInvite(companyId, invitedBy)
    const { data, error } = await admin.auth.admin.createUser({
      email: operatorEmail,
      password: operatorPassword,
      email_confirm: true,
      user_metadata: { ...userMetadata, invite_token: inviteToken },
    })
    if (error) throw new Error(`crear operador: ${error.message}`)
    user = data.user
    console.log('Usuario operador creado:', operatorEmail)
  } else {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password: operatorPassword,
      app_metadata: { ...user.app_metadata, ...appMetadata },
      user_metadata: { ...user.user_metadata, ...userMetadata },
    })
    if (error) throw new Error(`actualizar operador: ${error.message}`)
    user = data.user
    console.log('Usuario operador existente:', operatorEmail)
  }

  const { error: profileError } = await admin.from('users').upsert({
    id: user.id,
    company_id: companyId,
    email: operatorEmail,
    full_name: 'Operador Administrativo (Demo)',
    role: 'collaborator',
    is_active: true,
  })
  if (profileError) throw new Error(`perfil operador: ${profileError.message}`)

  const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, ...appMetadata },
    user_metadata: { ...user.user_metadata, ...userMetadata },
  })
  if (metaError) throw new Error(`metadata operador: ${metaError.message}`)

  return user
}

async function ensureDistribuidoraCompany(companyId) {
  const base = { name: 'Matías Distribuidora', country: 'AR', currency: 'ARS' }
  const withProfile = { ...base, operating_profile: 'distribuidora' }
  const { error } = await admin.from('companies').update(withProfile).eq('id', companyId)
  if (error?.message?.includes('operating_profile')) {
    console.warn('⚠ operating_profile no existe aún — corré: pnpm sb:push')
    const { error: fallbackError } = await admin.from('companies').update(base).eq('id', companyId)
    if (fallbackError) throw new Error(fallbackError.message)
    return false
  }
  if (error) throw new Error(error.message)
  return true
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
    .select('name, kind')
    .eq('company_id', companyId)
    .is('deleted_at', null)
  const keys = new Set((existing ?? []).map((c) => `${c.kind}:${c.name}`))

  const rows = [
    ...DEMO_CLIENTS.map((c) => ({
      company_id: companyId,
      name: c.name,
      kind: 'client',
      tax_id: c.tax_id,
    })),
    ...DEMO_SUPPLIERS.map((c) => ({
      company_id: companyId,
      name: c.name,
      kind: 'provider',
      tax_id: c.tax_id,
    })),
  ].filter((r) => !keys.has(`${r.kind}:${r.name}`))

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

  const componentType = spec.componentType ?? 'operative_cash'
  const { error: cmpError } = await client.rpc('set_operation_components', {
    p_transaction_id: txId,
    p_components: [
      {
        component_type: componentType,
        account_id: componentType === 'operative_cash' ? ids.caja : null,
        contact_id: spec.componentContactId ?? null,
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
  const { data: existingRows, error: existingError } = await admin
    .from('transactions')
    .select('description')
    .eq('company_id', companyId)
    .is('deleted_at', null)

  if (existingError) throw new Error(existingError.message)
  const existingDescriptions = new Set((existingRows ?? []).map((row) => row.description))

  const ids = {
    caja: await lookupId('accounts', companyId, { name: 'Caja' }),
    ventas: await lookupId('categories', companyId, { name: 'Ventas de Productos' }),
    cmv: await lookupId('categories', companyId, { name: 'Compra mercadería' }),
    flete: await lookupId('categories', companyId, { name: 'Flete' }),
    combustible: await lookupId('categories', companyId, { name: 'Combustible' }),
    cliente1: await lookupId('contacts', companyId, { name: DEMO_CLIENTS[0].name, kind: 'client' }),
    cliente2: await lookupId('contacts', companyId, { name: DEMO_CLIENTS[1].name, kind: 'client' }),
    proveedor1: await lookupId('contacts', companyId, { name: DEMO_SUPPLIERS[0].name, kind: 'provider' }),
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
    {
      type: 'income',
      kind: 'sale',
      amount: 64000,
      date: daysAgo(0),
      description: 'Venta a cuenta corriente — San Martín',
      categoryId: ids.ventas,
      contactId: ids.cliente2,
      contactType: 'cliente',
      componentType: 'client_receivable',
      componentContactId: ids.cliente2,
    },
    {
      type: 'income',
      kind: 'collection',
      amount: 30000,
      date: daysAgo(0),
      description: 'Cobro parcial — San Martín',
      categoryId: null,
      contactId: ids.cliente2,
      contactType: 'cliente',
    },
    {
      type: 'expense',
      kind: 'payment',
      amount: 11500,
      date: daysAgo(0),
      description: 'Pago flete operativo — Mercofus',
      categoryId: null,
      contactId: ids.proveedor1,
      contactType: 'proveedor',
    },
  ]

  let inserted = 0
  for (const spec of specs) {
    if (existingDescriptions.has(spec.description)) continue
    await createCashMovement(userClient, companyId, ids, spec)
    inserted += 1
  }

  console.log(`+${inserted} movimientos demo nuevos (aprobados)`)
  void userId
}

async function main() {
  const user = await ensureDemoUser()
  const companyId = await getCompanyIdForUser(user.id)
  const hasProfile = await ensureDistribuidoraCompany(companyId)
  await ensureOperatorUser(companyId, user.id)
  await bootstrapOperational(companyId)
  await seedDistribuidoraCategories(companyId)
  await seedContacts(companyId)
  await seedMovements(companyId, user.id)

  console.log('')
  console.log('Demo lista:')
  if (!hasProfile) {
    console.log('  ⚠ Falta migración operating_profile → pnpm sb:push y volvé a correr seed')
  }
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
