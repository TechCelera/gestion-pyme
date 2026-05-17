'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'

interface SecuritySectionProps {
  currentEmail: string
}

export function SecuritySection({ currentEmail }: SecuritySectionProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState(currentEmail)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isSavingEmail, setIsSavingEmail] = useState(false)

  const supabase = createSafeBrowserClient()

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setIsSavingPassword(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: currentPassword,
      })

      if (signInError) {
        toast.error('La contraseña actual no es correcta')
        return
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Contraseña actualizada')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } finally {
      setIsSavingPassword(false)
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newEmail.trim()
    if (!trimmed) {
      toast.error('Ingresá un correo válido')
      return
    }

    if (trimmed === currentEmail) {
      toast.info('El correo es el mismo que el actual')
      return
    }

    setIsSavingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed })
      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Revisá tu bandeja para confirmar el nuevo correo')
    } finally {
      setIsSavingEmail(false)
    }
  }

  return (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contraseña</CardTitle>
        <CardDescription>Cambiá tu contraseña de acceso</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña actual</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSavingPassword}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSavingPassword}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSavingPassword}
              required
              minLength={8}
            />
          </div>
          <Button
            type="submit"
            disabled={isSavingPassword}
            className="bg-[#7B68EE] hover:bg-[#7B68EE]/90"
          >
            {isSavingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Cambiar contraseña'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Correo electrónico</CardTitle>
        <CardDescription>
          Te enviaremos un enlace de confirmación al nuevo correo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangeEmail} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="newEmail">Nuevo correo</Label>
            <Input
              id="newEmail"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={isSavingEmail}
              required
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={isSavingEmail}
          >
            {isSavingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Solicitar cambio de correo'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  </>
  )
}
