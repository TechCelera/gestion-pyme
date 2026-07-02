import {
  type CompanyOperatingProfile,
  isDistribuidoraProfile,
} from '@/lib/company-operating-profile'
import { ROUTES } from '@/lib/constants'

const PROJECTS_PREFIX = '/proyectos'

export function shouldShowDashboardNavItem(
  href: string,
  operatingProfile: CompanyOperatingProfile,
  isAdmin: boolean
): boolean {
  if (!isDistribuidoraProfile(operatingProfile)) {
    return true
  }

  if (href === PROJECTS_PREFIX || href.startsWith(`${PROJECTS_PREFIX}/`)) {
    return false
  }

  if (
    !isAdmin &&
    (href === ROUTES.CATEGORIES || href.startsWith(`${ROUTES.CATEGORIES}/`))
  ) {
    return false
  }

  return true
}
