import { validateAuthPasswords } from './auth'

export function validateRegisterPasswords(
  password: string,
  confirmPassword: string
): string | null {
  return validateAuthPasswords(password, confirmPassword)
}

export function validateRegisterCompanyName(
  companyName: string,
  isInviteMode: boolean
): string | null {
  if (isInviteMode) return null
  if (!companyName.trim()) {
    return 'Ingresá el nombre de la empresa'
  }
  return null
}
