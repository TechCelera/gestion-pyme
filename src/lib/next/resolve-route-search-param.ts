/** Normaliza `searchParams` de App Router (string o string[]). */
export function resolveRouteSearchParam(
  raw: string | string[] | undefined
): string | undefined {
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw)) return raw[0]
  return undefined
}
