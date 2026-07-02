/** Demo comercial Matías Distribuidora — credenciales en NEXT_PUBLIC_* para prefill en /login. */
export function isDemoLoginEnabledPublic(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_LOGIN_ENABLED === '1'
}

export function demoLoginEmailPublic(): string | null {
  if (!isDemoLoginEnabledPublic()) return null
  return process.env.NEXT_PUBLIC_DEMO_EMAIL?.trim() || null
}

export function demoLoginPasswordPublic(): string | null {
  if (!isDemoLoginEnabledPublic()) return null
  return process.env.NEXT_PUBLIC_DEMO_PASSWORD?.trim() || null
}

/** Login con correo y contraseña ya cargados en el formulario. */
export function isDemoLoginPrefilled(): boolean {
  return Boolean(demoLoginEmailPublic() && demoLoginPasswordPublic())
}

export function isDemoLoginConfigured(): boolean {
  return isDemoLoginPrefilled()
}
