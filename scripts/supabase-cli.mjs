#!/usr/bin/env node
/**
 * Invoca el CLI de Supabase instalado en el sistema (PATH o ubicaciones conocidas).
 * El paquete npm `supabase` suele dar segfault en algunos entornos Linux.
 * Releases ≥2.100: extraer el .tar.gz en ~/.local/share/supabase (supabase + supabase-go).
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)

function resolveSupabaseBinary() {
  const fromPath = process.env.SUPABASE_CLI_BIN
  if (fromPath && existsSync(fromPath)) return fromPath

  const candidates = [
    join(homedir(), '.local', 'share', 'supabase', 'supabase'),
    join(homedir(), '.local', 'bin', 'supabase'),
    '/usr/bin/supabase',
    '/usr/local/bin/supabase',
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }

  return 'supabase'
}

const supabaseBin = resolveSupabaseBinary()
const binDir = join(supabaseBin, '..')
const env = {
  ...process.env,
  PATH: `${binDir}${process.env.PATH ? `:${process.env.PATH}` : ''}`,
}

const result = spawnSync(supabaseBin, args, {
  stdio: 'inherit',
  env,
})

if (result.error) {
  if (result.error.code === 'ENOENT') {
    console.error(
      '\nNo se encontró `supabase`.\n' +
        'Instalá el release oficial (supabase + supabase-go en el mismo directorio), por ejemplo:\n' +
        '  mkdir -p "$HOME/.local/share/supabase"\n' +
        '  curl -sL https://github.com/supabase/cli/releases/download/v2.100.1/supabase_2.100.1_linux_amd64.tar.gz \\\n' +
        '    | tar -xzf - -C "$HOME/.local/share/supabase"\n' +
        '  echo \'export PATH="$HOME/.local/share/supabase:$PATH"\' >> ~/.zshrc\n'
    )
  } else {
    console.error(result.error.message)
  }
  process.exit(1)
}

process.exit(result.status ?? 1)
