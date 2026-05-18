'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@/lib/constants'
import { toast } from 'sonner'
import { mapSignInErrorMessage, normalizeAuthEmail } from '@/lib/validations/auth'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthSubmitButton } from '@/components/auth/auth-submit-button'
import { AuthFooterLink } from '@/components/auth/auth-footer-link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createSafeBrowserClient()

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizeAuthEmail(email),
        password,
      })

      if (error) {
        toast.error(mapSignInErrorMessage(error))
        return
      }

      if (data.user) {
        toast.success('Inicio de sesión exitoso')
        router.push(ROUTES.DASHBOARD)
        router.refresh()
      }
    } catch {
      toast.error('Error al iniciar sesión')
    } finally {
      setLoading(false)
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
            className="h-10"
          />
        </div>
        <AuthSubmitButton loading={loading} loadingLabel="Ingresando...">
          Iniciar sesión
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}
