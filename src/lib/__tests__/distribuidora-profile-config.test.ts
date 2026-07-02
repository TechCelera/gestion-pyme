import { describe, expect, it } from 'vitest'

import { COUNTRY_CONFIGS } from '@/lib/country-config'
import {
  DISTRIBUIDORA_EXTRA_CATEGORIES,
  seedCategoriesForCompany,
} from '@/lib/distribuidora-profile-config'

describe('distribuidora-profile-config', () => {
  it('default profile solo usa categorías del país', () => {
    const categories = seedCategoriesForCompany(COUNTRY_CONFIGS.AR, 'default')
    expect(categories).toEqual(COUNTRY_CONFIGS.AR.categories)
  })

  it('distribuidora agrega categorías operativas sin duplicar nombres', () => {
    const categories = seedCategoriesForCompany(COUNTRY_CONFIGS.AR, 'distribuidora')
    expect(categories.length).toBe(
      COUNTRY_CONFIGS.AR.categories.length + DISTRIBUIDORA_EXTRA_CATEGORIES.length
    )
    expect(categories.map((c) => c.name)).toContain('Compra mercadería')
    expect(categories.map((c) => c.name)).toContain('Flete')
  })
})
