/**
 * Montos en UI: formato es-AR (1.234,56) mientras se escribe;
 * valor canónico interno "1234.56" para parseFloat / Zod.
 */

export function getMoneyFractionDigits(currency?: string): number {
  return currency === 'COP' ? 0 : 2
}

/** Texto del usuario → valor canónico (punto decimal, sin miles). */
export function parseMoneyInputToCanonical(
  raw: string,
  fractionDigits = 2
): string {
  const s = raw.trim().replace(/\s/g, '')
  if (!s) return ''

  const commaIdx = s.lastIndexOf(',')
  const dotIdx = s.lastIndexOf('.')

  let intPart = ''
  let decPart = ''

  if (commaIdx >= 0) {
    intPart = s.slice(0, commaIdx).replace(/\./g, '').replace(/\D/g, '')
    decPart = s.slice(commaIdx + 1).replace(/\D/g, '').slice(0, fractionDigits)
  } else if (dotIdx >= 0) {
    const after = s.slice(dotIdx + 1).replace(/\D/g, '')
    if (after.length > 0 && after.length <= fractionDigits) {
      intPart = s.slice(0, dotIdx).replace(/\./g, '').replace(/\D/g, '')
      decPart = after
    } else {
      intPart = s.replace(/\./g, '').replace(/\D/g, '')
    }
  } else {
    intPart = s.replace(/\D/g, '')
  }

  if (!intPart && !decPart) return ''

  if (fractionDigits === 0) {
    return intPart
  }

  const trailingSep = s.endsWith(',') || s.endsWith('.')
  if (trailingSep && !decPart) {
    return `${intPart || '0'}.`
  }

  return decPart ? `${intPart || '0'}.${decPart}` : intPart
}

/** Valor canónico → texto formateado para el input. */
export function formatMoneyInputFromCanonical(
  canonical: string,
  fractionDigits = 2
): string {
  if (!canonical) return ''

  const trailingDot = canonical.endsWith('.')
  const [intRaw, decRaw = ''] = canonical.split('.')
  const intDigits = intRaw.replace(/\D/g, '')

  if (!intDigits && !decRaw && !trailingDot) return ''

  const intFormatted = intDigits
    ? new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Number(intDigits))
    : ''

  if (fractionDigits === 0) {
    return intFormatted
  }

  if (trailingDot) {
    return intFormatted ? `${intFormatted},` : ','
  }

  if (canonical.includes('.')) {
    const dec = decRaw.slice(0, fractionDigits)
    return intFormatted ? `${intFormatted},${dec}` : `,${dec}`
  }

  return intFormatted
}

export function moneyInputToNumber(canonical: string): number {
  if (!canonical || canonical === '.') return Number.NaN
  return Number.parseFloat(canonical)
}
