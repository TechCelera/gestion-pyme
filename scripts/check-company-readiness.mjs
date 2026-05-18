#!/usr/bin/env node
/**
 * Verifica si una empresa/usuario está lista para piloto (cuentas, categorías, plan, período).
 *
 * Uso:
 *   node scripts/check-company-readiness.mjs [email|fragmento]
 *   pnpm run check:readiness -- bernabe
 *
 * Variables (en .env.local o ya exportadas en el shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Supabase → Project Settings → API → service_role)
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { loadDotenvFile, loadDotenvFiles } from './load-dotenv.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const envFileArg = process.argv.find((a) => a.startsWith('--env-file='))
const extraEnvFile = envFileArg?.slice('--env-file='.length)

loadDotenvFiles(root)
if (extraEnvFile) {
  loadDotenvFile(resolve(root, extraEnvFile))
}

const positional = process.argv.filter((a) => !a.startsWith('--'))
const needle = (positional[2] || 'bernabe').toLowerCase()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!url || !serviceKey) {
  const missing = [
    !url && 'NEXT_PUBLIC_SUPABASE_URL',
    !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean)

  console.error(`Faltan en el entorno: ${missing.join(', ')}`)
  console.error('')
  console.error('El script lee .env y .env.local en la raíz del repo (si existen).')
  console.error('Tu .env.local debe incluir al menos:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...   ← service_role en Supabase → Settings → API')
  console.error('')
  console.error('Copiá desde .env.example o traé variables de Vercel:')
  console.error('  vercel env pull .env.local')
  console.error('')
  console.error('También podés exportarlas solo para este comando:')
  console.error(
    '  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/check-company-readiness.mjs bernabe'
  )
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: authData, error: authErr } = await admin.auth.admin.listUsers({ perPage: 200 })
if (authErr) {
  console.error('Error listando auth.users:', authErr.message)
  process.exit(1)
}

const authMatches = (authData?.users ?? []).filter((u) => {
  const email = (u.email ?? '').toLowerCase()
  const name = String(u.user_metadata?.full_name ?? '').toLowerCase()
  const company = String(u.user_metadata?.company_name ?? '').toLowerCase()
  return email.includes(needle) || name.includes(needle) || company.includes(needle)
})

if (authMatches.length === 0) {
  console.log(`No hay usuario en Auth que coincida con "${needle}".`)
  process.exit(2)
}

const db = createClient(url, serviceKey)

for (const au of authMatches) {
  const { data: pu, error: puErr } = await db
    .from('users')
    .select('id, email, full_name, role, is_active, company_id, companies(id, name, country, currency)')
    .eq('id', au.id)
    .maybeSingle()

  console.log('\n---')
  console.log('Auth:', au.email)
  console.log('  email_confirmado:', !!au.email_confirmed_at)
  console.log('  app_metadata.company_id:', au.app_metadata?.company_id ?? '(vacío)')
  console.log('  app_metadata.role:', au.app_metadata?.role ?? '(vacío)')

  if (puErr || !pu) {
    console.log('  public.users:', puErr?.message ?? 'NO EXISTE — registro incompleto')
    continue
  }

  const companyId = pu.company_id
  const company = pu.companies
  console.log('  public.users:', pu.full_name, '| rol:', pu.role, '| activo:', pu.is_active)
  console.log('  empresa:', company?.name ?? '?', `(${company?.country ?? '?'})`)

  const checks = await Promise.all([
    db.from('accounts').select('id', { count: 'exact', head: true }).eq('company_id', companyId).is('deleted_at', null),
    db.from('categories').select('id', { count: 'exact', head: true }).eq('company_id', companyId).is('deleted_at', null),
    db.from('chart_of_accounts').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    db
      .from('periods')
      .select('year, month, status')
      .eq('company_id', companyId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(3),
    db.from('transactions').select('id', { count: 'exact', head: true }).eq('company_id', companyId).is('deleted_at', null),
  ])

  const [acc, cat, coa, periods, tx] = checks
  const now = new Date()
  const openPeriod = (periods.data ?? []).find(
    (p) => p.year === now.getFullYear() && p.month === now.getMonth() + 1 && p.status === 'open'
  )

  const ready =
    pu.is_active &&
    au.email_confirmed_at &&
    au.app_metadata?.company_id === companyId &&
    (acc.count ?? 0) >= 1 &&
    (cat.count ?? 0) >= 1 &&
    (coa.count ?? 0) >= 1 &&
    !!openPeriod

  console.log('  cuentas activas:', acc.count ?? 0, acc.error?.message ?? '')
  console.log('  categorías:', cat.count ?? 0, cat.error?.message ?? '')
  console.log('  plan de cuentas:', coa.count ?? 0, coa.error?.message ?? '')
  console.log(
    '  período mes actual abierto:',
    openPeriod ? 'sí' : 'no',
    periods.data?.length ? `(últimos: ${JSON.stringify(periods.data)})` : ''
  )
  console.log('  movimientos:', tx.count ?? 0)
  console.log('  LISTO PARA PILOTO:', ready ? 'SÍ' : 'NO — ver arriba')

  if (!au.email_confirmed_at) console.log('  → Confirmar email en Supabase Auth')
  if (!pu.is_active) console.log('  → Activar usuario en public.users')
  if (au.app_metadata?.company_id !== companyId) console.log('  → Sincronizar app_metadata (re-login o fix metadata)')
  if ((acc.count ?? 0) < 1 || (cat.count ?? 0) < 1) {
    console.log('  → Entrar al dashboard (seed) o fn_bootstrap_company_operational')
  }
  if ((coa.count ?? 0) < 1) console.log('  → fn_seed_company_chart_accounts')
  if (!openPeriod) console.log('  → fn_ensure_open_period')
}
