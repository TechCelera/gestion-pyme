import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GoogleIcon } from '@/components/auth/google-icon'

type GoogleSignInButtonProps = {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  label?: string
  loadingLabel?: string
  className?: string
}

/** Botón de OAuth con Google (estilo marca: fondo claro, borde, icono G). */
export function GoogleSignInButton({
  onClick,
  loading = false,
  disabled = false,
  label = 'Continuar con Google',
  loadingLabel = 'Conectando con Google…',
  className,
}: GoogleSignInButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'h-10 w-full border-border/80 bg-white text-foreground shadow-sm hover:bg-neutral-50 dark:bg-card dark:hover:bg-muted/60',
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin text-muted-foreground" aria-hidden />
          {loadingLabel}
        </>
      ) : (
        <>
          <GoogleIcon className="mr-2" />
          {label}
        </>
      )}
    </Button>
  )
}
