type AuthGoogleHintProps = {
  variant?: 'login' | 'register'
}

export function AuthGoogleHint({ variant = 'login' }: AuthGoogleHintProps) {
  if (variant === 'register') {
    return (
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Si es tu primera vez, después de Google completás empresa, nombre y país en esta misma
        pantalla. Si no tenés Google, usá el formulario de abajo.
      </p>
    )
  }

  return (
    <p className="text-center text-xs leading-relaxed text-muted-foreground">
      Si es tu primera vez, después de Google completás empresa, nombre y país aquí mismo. Si no
      tenés Google, usá correo y contraseña abajo.
    </p>
  )
}
