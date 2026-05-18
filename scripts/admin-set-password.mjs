#!/usr/bin/env node
/**
 * Asigna contraseña temporal a un usuario (sin correo). Solo piloto / soporte.
 *
 * Uso:
 *   pnpm run admin:set-password -- bernabeaguilar1@gmail.com 'TempPilot2026!'
 *   node scripts/admin-set-password.mjs bernabe TempPilot2026!
 *
 * Requiere SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API → service_role).
 * Carga .env, .env.local y .env.production en ese orden.
 */
import { randomBytes } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { loadDotenvFile, loadDotenvFiles } from './load-dotenv.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const envFileArg = process.argv.find((a) => a.startsWith('--env-file='))
const extraEnvFile = envFileArg?.slice('--env-file='.length)

loadDotenvFiles(root, ['.env', '.env.local', '.env.production'])
if (extraEnvFile) {
  loadDotenvFile(resolve(root, extraEnvFile))
}

const positional = process.argv.filter((a) => !a.startsWith('--'))
const emailNeedle = (positional[2] || '').trim().toLowerCase()
const passwordArg = positional[3]?.trim()

if (!emailNeedle) {
  console.error('Uso: pnpm run admin:set-password -- <correo-o-fragmento> [contraseña-temporal]')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!url || !serviceKey) {
  const missing = [
    !url && 'NEXT_PUBLIC_SUPABASE_URL',
    !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean)

  console.error(`Faltan en el entorno: ${missing.join(', ')}`)
  console.error('')
  console.error('Tu .env.local actual puede no tener Supabase (solo Vercel OIDC).')
  console.error('Agregá en .env.local:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ...   (service_role, secreto)')
  console.error('')
  console.error('O exportá solo para este comando:')
  console.error(
    '  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm run admin:set-password -- usuario@mail.com'
  )
  process.exit(1)
}

function generateTempPassword() {
  const suffix = randomBytes(3).toString('hex')
  return `Pilot${suffix}!9`
}

const tempPassword = passwordArg && passwordArg.length >= 8 ? passwordArg : generateTempPassword()

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 })
if (listError) {
  console.error('Error listando usuarios:', listError.message)
  process.exit(1)
}

const matches = (data.users ?? []).filter((u) =>
  (u.email ?? '').toLowerCase().includes(emailNeedle)
)

if (matches.length === 0) {
  console.error(`No se encontró usuario con "${emailNeedle}"`)
  process.exit(1)
}

if (matches.length > 1) {
  console.error('Varios usuarios coinciden:')
  for (const u of matches) {
    console.error(`  ${u.id}  ${u.email}`)
  }
  console.error('Usá un fragmento más específico del correo.')
  process.exit(1)
}

const user = matches[0]
const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
  password: tempPassword,
})

if (updateError) {
  console.error('Error al asignar contraseña:', updateError.message)
  process.exit(1)
}

console.log('Usuario:', user.email)
console.log('UUID:', user.id)
console.log('Contraseña temporal:', tempPassword)
console.log('')
console.log('Indicá al usuario: login en gamma → Configuración → cambiar contraseña.')
