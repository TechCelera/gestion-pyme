'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@/lib/constants'
import { buildAuthCallbackRedirect } from '@/lib/utils/app-origin'
import { mapPasswordResetErrorMessage, normalizeAuthEmail } from '@/lib/validations/auth'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthSubmitButton } from '@/components/auth/auth-submit-button'

const RESEND_COOLDOWN_SECONDS = 60

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (cooldownSeconds <= 0) return

    const timerId = window.setInterval(() => {
      setCooldownSeconds((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [cooldownSeconds])

  function startCooldown() {
    setCooldownSeconds(RESEND_COOLDOWN_SECONDS)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (cooldownSeconds > 0) return

    setLoading(true)
    try {
      const supabase = createSafeBrowserClient()
      const redirectTo = buildAuthCallbackRedirect(
        ROUTES.RESET_PASSWORD,
        window.location.origin
      )
      const { error } = await supabase.auth.resetPasswordForEmail(normalizeAuthEmail(email), {
        redirectTo,
      })

      if (error) {
        const message = mapPasswordResetErrorMessage(error)
        toast.error(message)
        if (message.includes('Espera')) {
          startCooldown()
        }
        return
      }

      setSent(true)
      startCooldown()
      toast.success('Si el correo existe, recibirás un enlace en unos minutos')
    } catch {
      toast.error('No se pudo enviar el correo de recuperación')
    } finally {
      setLoading(false)
    }
  }

  const submitDisabled = loading || cooldownSeconds > 0
  const submitLabel =
    cooldownSeconds > 0
      ? `Espera ${cooldownSeconds}s para reenviar`
      : sent
        ? 'Reenviar enlace'
        : 'Enviar enlace'

  return (
    <AuthShell
      title="Recuperar contraseña"
      description="Te enviamos un enlace para elegir una contraseña nueva."
      footer={
        <p className="text-center text-sm">
          <Link href={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-3 text-center text-sm text-muted-foreground">
          <p>
            Revisa tu bandeja de entrada (y spam) para{' '}
            <strong className="text-foreground">{email}</strong>.
          </p>
          {cooldownSeconds > 0 ? (
            <p>Podrás pedir otro enlace en {cooldownSeconds} segundos.</p>
          ) : null}
        </div>
      ) : null}

      {!sent || cooldownSeconds === 0 ? (
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          {!sent ? (
            <div className="space-y-2">
              <Label htmlFor="email">Correo de tu cuenta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username email"
                autoCapitalize="none"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>
          ) : null}
          <AuthSubmitButton
            loading={loading}
            loadingLabel="Enviando..."
            disabled={submitDisabled}
          >
            {submitLabel}
          </AuthSubmitButton>
        </form>
      ) : null}
    </AuthShell>
  )
}
