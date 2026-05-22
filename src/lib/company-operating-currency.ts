import { COUNTRY_CONFIGS, type CountryConfig } from '@/lib/country-config'

const DEFAULT_COUNTRY = 'AR'

/** ISO country code supported for onboarding and company settings. */
export function normalizeCompanyCountry(country: string | null | undefined): string {
  const code = (country ?? DEFAULT_COUNTRY).trim().toUpperCase()
  return code in COUNTRY_CONFIGS ? code : DEFAULT_COUNTRY
}

export function countryConfig(country: string | null | undefined): CountryConfig {
  return COUNTRY_CONFIGS[normalizeCompanyCountry(country)]
}

/** Operating currency derived from company country (single-currency model). */
export function currencyForCountry(country: string | null | undefined): string {
  return countryConfig(country).currency
}

export function currencyLabelForCountry(country: string | null | undefined): string {
  const cfg = countryConfig(country)
  return `${cfg.currency} (${cfg.currencySymbol})`
}

export function isSupportedCompanyCountry(country: string): boolean {
  return country.trim().toUpperCase() in COUNTRY_CONFIGS
}
