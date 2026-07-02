export const COMPANY_OPERATING_PROFILES = ['default', 'distribuidora'] as const

export type CompanyOperatingProfile = (typeof COMPANY_OPERATING_PROFILES)[number]

const DEFAULT_OPERATING_PROFILE: CompanyOperatingProfile = 'default'

export function normalizeOperatingProfile(
  profile: string | null | undefined
): CompanyOperatingProfile {
  const value = (profile ?? DEFAULT_OPERATING_PROFILE).trim().toLowerCase()
  return COMPANY_OPERATING_PROFILES.includes(value as CompanyOperatingProfile)
    ? (value as CompanyOperatingProfile)
    : DEFAULT_OPERATING_PROFILE
}

export function isDistribuidoraProfile(profile: CompanyOperatingProfile): boolean {
  return profile === 'distribuidora'
}
