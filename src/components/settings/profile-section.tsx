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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
          <CardDescription>El nombre se muestra en movimientos y reportes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
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
                'Guardar nombre'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle className="text-base">Resumen de cuenta</CardTitle>
          <CardDescription>Datos de acceso (solo lectura)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Correo</p>
            <p className="font-medium break-all">{profile.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rol</p>
            <p className="font-medium">{getUserRoleLabel(profile.role)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Empresa</p>
            <p className="font-medium">{profile.companyName || '—'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
