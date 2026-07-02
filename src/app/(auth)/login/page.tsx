'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { Loader2, Store } from 'lucide-react'
import { toast } from 'sonner'

import { signInAction } from '@/lib/actions/auth'
import { navigateAfterAuth } from '@/lib/auth/post-auth-navigation'
import { startGoogleOAuth } from '@/lib/auth/google-oauth'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@/lib/constants'
import {
  demoLoginEmailPublic,
  demoLoginPasswordPublic,
  isDemoLoginPrefilled,
} from '@/lib/demo/matias-demo'
import {
  mapGoogleOAuthStartError,
  mapOAuthCallbackError,
} from '@/lib/validations/auth'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthSubmitButton } from '@/components/auth/auth-submit-button'
import { AuthFooterLink } from '@/components/auth/auth-footer-link'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { AuthMethodDivider } from '@/components/auth/auth-method-divider'
import { AuthGoogleHint } from '@/components/auth/auth-google-hint'
import { CompleteAccountFields } from '@/components/auth/complete-account-fields'
import { useAuthCompletionView } from '@/components/auth/use-auth-completion-view'

function LoginPageContent() {
  const { view, prefill, nextPath } = useAuthCompletionView()
  const demoPrefilled = isDemoLoginPrefilled()
  const demoEmail = demoLoginEmailPublic() ?? ''
  const demoPassword = demoLoginPasswordPublic() ?? ''
  const [email, setEmail] = useState(() => (demoPrefilled ? demoEmail : ''))
  const [password, setPassword] = useState(() => (demoPrefilled ? demoPassword : ''))
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    const description = params.get('error_description')
    if (error) {
      toast.error(mapOAuthCallbackError(error, description))
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      url.searchParams.delete('error_description')
      window.history.replaceState({}, '', url.pathname + url.search)
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signInAction(email, password)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      navigateAfterAuth(result.redirectTo)
    } catch {
      toast.error('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    try {
      const result = await startGoogleOAuth({
        returnSurface: 'login',
        nextPath,
      })
      if (!result.ok) {
        toast.error(mapGoogleOAuthStartError(result.error))
        setGoogleLoading(false)
      }
    } catch {
      toast.error(mapGoogleOAuthStartError())
      setGoogleLoading(false)
    }
  }

  if (view === 'loading') {
    return (
      <AuthShell title="Gestion PYME Pro" description="Cargando…">
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        </div>
      </AuthShell>
    )
  }

  if (view === 'complete' && prefill) {
    return (
      <AuthShell
        title="Terminemos tu registro"
        description="Es tu primer ingreso con Google. Completá tu empresa en este paso."
        footer={
          <AuthFooterLink prompt="¿Ya tienes cuenta?" href={ROUTES.REGISTER} linkLabel="Regístrate" />
        }
      >
        <CompleteAccountFields prefill={prefill} nextPath={nextPath} />
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={demoPrefilled ? 'Matías Distribuidora' : 'Gestion PYME Pro'}
      description={
        demoPrefilled
          ? 'Demo — cuenta lista, solo iniciá sesión'
          : 'Inicia sesión en tu cuenta'
      }
      footer={
        demoPrefilled ? undefined : (
          <AuthFooterLink prompt="¿No tienes cuenta?" href={ROUTES.REGISTER} linkLabel="Regístrate" />
        )
      }
    >
      <div className="space-y-4">
        {demoPrefilled ? (
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p className="text-muted-foreground">
              Datos de ejemplo cargados. Tocá{' '}
              <span className="font-medium text-foreground">Iniciar sesión</span> y listo.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <GoogleSignInButton
                onClick={handleGoogleLogin}
                loading={googleLoading}
                disabled={loading}
              />
              <AuthGoogleHint variant="login" />
            </div>
            <AuthMethodDivider />
          </>
        )}

        <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || googleLoading}
              className="h-10"
              readOnly={demoPrefilled}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">Contraseña</Label>
              {!demoPrefilled ? (
                <Link
                  href={ROUTES.FORGOT_PASSWORD}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              ) : null}
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || googleLoading}
              className="h-10"
              readOnly={demoPrefilled}
            />
          </div>
          <AuthSubmitButton
            loading={loading}
            loadingLabel="Ingresando..."
            disabled={googleLoading}
          >
            Iniciar sesión
          </AuthSubmitButton>
        </form>
      </div>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Gestion PYME Pro" description="Cargando…">
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
          </div>
        </AuthShell>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
