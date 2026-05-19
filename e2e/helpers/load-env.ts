import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Carga `.env` y `.env.local` sin pisar variables ya definidas. */
export function loadPlaywrightEnv(rootDir = process.cwd()) {
  for (const name of ['.env', '.env.local']) {
    const path = resolve(rootDir, name)
    if (!existsSync(path)) continue
    const text = readFileSync(path, 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      if (!key || process.env[key] !== undefined) continue
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      process.env[key] = val
    }
  }
}
