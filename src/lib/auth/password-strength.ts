export type PasswordCheck = {
  id: string
  label: string
  met: boolean
}

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    {
      id: 'length',
      label: 'Al menos 8 caracteres',
      met: password.length >= 8,
    },
    {
      id: 'letter',
      label: 'Al menos una letra',
      met: /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(password),
    },
    {
      id: 'number',
      label: 'Al menos un número',
      met: /\d/.test(password),
    },
  ]
}

export function isPasswordStrong(password: string): boolean {
  return getPasswordChecks(password).every((check) => check.met)
}
