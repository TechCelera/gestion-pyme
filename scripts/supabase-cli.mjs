#!/usr/bin/env node
/**
 * Invoca el CLI de Supabase instalado en el sistema (PATH).
 * El paquete npm `supabase` suele dar segfault en algunos entornos Linux;
 * en Arch/CachyOS: `sudo pacman -S supabase` o el binario oficial en PATH.
 */
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const result = spawnSync('supabase', args, {
  stdio: 'inherit',
  env: process.env,
})

if (result.error) {
  if (result.error.code === 'ENOENT') {
    console.error(
      '\nNo se encontró `supabase` en PATH.\n' +
        'Instalalo en el sistema (p. ej. pacman -S supabase) y volvé a intentar.\n'
    )
  } else {
    console.error(result.error.message)
  }
  process.exit(1)
}

process.exit(result.status ?? 1)
