'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

import { signInAction } from '@/lib/actions/auth'
import { navigateAfterAuth } from '@/lib/auth/post-auth-navigation'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { buildAuthCallbackRedirect, getClientAppOrigin } from '@/lib/utils/app-origin'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthSubmitButton } from '@/components/auth/auth-submit-button'
import { AuthFooterLink } from '@/components/auth/auth-footer-link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'auth_callback') {
      toast.error('No pudimos verificar tu cuenta. Pedí un enlace nuevo o iniciá sesión.')
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
      const redirectTo = buildAuthCallbackRedirect(ROUTES.DASHBOARD, getClientAppOrigin())
      const supabase = createSafeBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })

      if (error) {
        toast.error('No pudimos iniciar sesión con Google. Intenta de nuevo.')
        setGoogleLoading(false)
      }
    } catch {
      toast.error('No pudimos iniciar sesión con Google. Intenta de nuevo.')
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell
      title="Gestion PYME Pro"
      description="Inicia sesión en tu cuenta"
      footer={
        <AuthFooterLink prompt="¿No tienes cuenta?" href={ROUTES.REGISTER} linkLabel="Regístrate" />
      }
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="h-10 w-full"
        >
          {googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">o con correo y contraseña</span>
          </div>
        </div>

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
              disabled={loading}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-xs font-medium text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-10"
            />
          </div>
          <AuthSubmitButton loading={loading} loadingLabel="Ingresando...">
            Iniciar sesión
          </AuthSubmitButton>
        </form>
      </div>
    </AuthShell>
  )
}
