'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@/lib/constants'
import { normalizeAuthEmail } from '@/lib/validations/auth'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthSubmitButton } from '@/components/auth/auth-submit-button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createSafeBrowserClient()
      const redirectTo = `${window.location.origin}${ROUTES.RESET_PASSWORD}`
      const { error } = await supabase.auth.resetPasswordForEmail(normalizeAuthEmail(email), {
        redirectTo,
      })

      if (error) {
        toast.error('No se pudo enviar el correo. Intentá de nuevo en unos minutos.')
        return
      }

      setSent(true)
      toast.success('Si el correo existe, recibirás un enlace en unos minutos')
    } catch {
      toast.error('No se pudo enviar el correo de recuperación')
    } finally {
      setLoading(false)
    }
  }

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
        <p className="text-center text-sm text-muted-foreground">
          Revisa tu bandeja de entrada (y spam) para <strong className="text-foreground">{email}</strong>.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
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
          <AuthSubmitButton loading={loading} loadingLabel="Enviando...">
            Enviar enlace
          </AuthSubmitButton>
        </form>
      )}
    </AuthShell>
  )
}
