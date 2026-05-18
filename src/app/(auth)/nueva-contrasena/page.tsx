'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { updatePasswordAction } from '@/lib/actions/auth'
import { navigateAfterAuth } from '@/lib/auth/post-auth-navigation'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@/lib/constants'
import { validateAuthPasswords } from '@/lib/validations/auth'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthSubmitButton } from '@/components/auth/auth-submit-button'
import { PasswordStrengthHint } from '@/components/auth/password-strength-hint'

const SESSION_WAIT_MS = 8_000

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      const callbackUrl = new URL(ROUTES.AUTH_CALLBACK, window.location.origin)
      callbackUrl.searchParams.set('code', code)
      callbackUrl.searchParams.set('next', ROUTES.RESET_PASSWORD)
      window.location.replace(callbackUrl.toString())
      return
    }

    const supabase = createSafeBrowserClient()
    let settled = false

    function markReady() {
      if (settled) return
      settled = true
      setReady(true)
      setSessionError(false)
    }

    function markSessionError() {
      if (settled) return
      settled = true
      setSessionError(true)
    }

    const timeoutId = window.setTimeout(() => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          markReady()
          return
        }
        markSessionError()
      })
    }, SESSION_WAIT_MS)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        markReady()
      }
    })

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) markReady()
    })

    return () => {
      window.clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const passwordError = validateAuthPasswords(password, confirm)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    setLoading(true)
    try {
      const result = await updatePasswordAction(password)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      navigateAfterAuth(result.redirectTo)
    } catch {
      toast.error('No se pudo actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Nueva contraseña"
      description="Elegí una contraseña segura para tu cuenta."
      footer={
        <p className="text-center text-sm">
          <Link href={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      }
    >
      {sessionError ? (
        <div className="space-y-4 text-center text-sm text-muted-foreground">
          <p>
            El enlace no es válido o ya expiró. Solicita uno nuevo para continuar.
          </p>
          <Link
            href={ROUTES.FORGOT_PASSWORD}
            className="inline-block font-medium text-primary hover:underline"
          >
            Pedir enlace de recuperación
          </Link>
        </div>
      ) : !ready ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Contraseña nueva</Label>
            <PasswordInput
              id="newPassword"
              name="new-password"
              autoComplete="new-password"
              placeholder="Letras y números, mínimo 8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="h-10"
            />
            <PasswordStrengthHint password={password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirm-password"
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              className="h-10"
            />
          </div>
          <AuthSubmitButton loading={loading} loadingLabel="Guardando...">
            Guardar contraseña
          </AuthSubmitButton>
        </form>
      )}
    </AuthShell>
  )
}
