const CURRENCY_LOCALE: Record<string, string> = {
  ARS: 'es-AR',
  COP: 'es-CO',
  EUR: 'es-ES',
  USD: 'en-US',
}

function localeForCurrency(currency: string): string {
  return CURRENCY_LOCALE[currency] ?? 'es-AR'
}

export function formatCurrency(
  amount: number,
  currency = 'ARS',
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  const fractionDigits = currency === 'COP' ? 0 : 2
  try {
    return new Intl.NumberFormat(localeForCurrency(currency), {
      style: 'currency',
      currency,
      minimumFractionDigits: options?.minimumFractionDigits ?? fractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits ?? fractionDigits,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

/** Reports default to ARS company currency. */
export function formatReportCurrency(value: number): string {
  return formatCurrency(value, 'ARS')
}
