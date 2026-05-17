'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/lib/actions/profile'
import { getUserRoleLabel } from '@/lib/constants'
import type { UserProfile } from '@/lib/actions/profile'

interface ProfileSectionProps {
  profile: UserProfile
  onUpdated: (fullName: string) => void
}

export function ProfileSection({ profile, onUpdated }: ProfileSectionProps) {
  const [fullName, setFullName] = useState(profile.fullName)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      const result = await updateProfile(fullName)
      if (result.success) {
        toast.success('Perfil actualizado')
        onUpdated(fullName.trim())
      } else {
        toast.error(result.error ?? 'Error al guardar')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Perfil</CardTitle>
        <CardDescription>Tu información personal en la empresa</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSaving}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              Para cambiar el correo usá la sección Correo más abajo.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Input
                value={getUserRoleLabel(profile.role)}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input value={profile.companyName || '—'} disabled className="bg-muted" />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#7B68EE] hover:bg-[#7B68EE]/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
