import {
  type CompanyOperatingProfile,
  isDistribuidoraProfile,
} from '@/lib/company-operating-profile'
import type { CountryConfig } from '@/lib/country-config'
import type { CategoryType } from '@/lib/validations/category'

export interface DistribuidoraSeedCategory {
  name: string
  type: CategoryType
}

/** Categorías extra para CMV y gastos operativos (idempotente por nombre). */
export const DISTRIBUIDORA_EXTRA_CATEGORIES: DistribuidoraSeedCategory[] = [
  { name: 'Compra mercadería', type: 'expense' },
  { name: 'Flete', type: 'expense' },
  { name: 'Peones y jornales', type: 'expense' },
  { name: 'Combustible', type: 'expense' },
  { name: 'Gastos de mercado', type: 'expense' },
]

export function seedCategoriesForCompany(
  countryConfig: CountryConfig,
  operatingProfile: CompanyOperatingProfile
): DistribuidoraSeedCategory[] {
  const base = countryConfig.categories
  if (!isDistribuidoraProfile(operatingProfile)) {
    return base
  }

  const names = new Set(base.map((category) => category.name))
  const extras = DISTRIBUIDORA_EXTRA_CATEGORIES.filter((category) => !names.has(category.name))
  return [...base, ...extras]
}
