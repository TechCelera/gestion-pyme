import { currencyForCountry, normalizeCompanyCountry } from '@/lib/company-operating-currency'
import type { createClient } from '@/lib/supabase/server'

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

export async function fetchOperatingCurrencyForCompany(
  supabase: ServerSupabase,
  companyId: string
): Promise<string> {
  const { data } = await supabase
    .from('companies')
    .select('country')
    .eq('id', companyId)
    .maybeSingle()

  return currencyForCountry(normalizeCompanyCountry(data?.country as string | null))
}

export function operatingCurrencyMismatchMessage(operating: string): string {
  return `La moneda del movimiento debe ser ${operating} (moneda de la empresa).`
}

export function isOperatingCurrency(operating: string, submitted: string): boolean {
  return submitted === operating
}
