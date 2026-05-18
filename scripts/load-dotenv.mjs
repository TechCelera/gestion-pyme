import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Carga variables desde archivos .env (sin dependencias).
 * Orden: archivos en orden → los últimos no pisan claves ya definidas en process.env.
 */
export function loadDotenvFiles(rootDir, filenames = ['.env', '.env.local']) {
  for (const name of filenames) {
    const path = resolve(rootDir, name)
    if (!existsSync(path)) continue
    loadDotenvFile(path)
  }
}

export function loadDotenvFile(filePath) {
  const text = readFileSync(filePath, 'utf8')
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
