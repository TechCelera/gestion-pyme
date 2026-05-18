'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deactivateAccount } from '@/lib/actions/profile'
import { useAuthStore } from '@/stores/auth-store'

const CONFIRM_TEXT = 'ELIMINAR'

export function DangerZoneSection() {
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const clearUser = useAuthStore((state) => state.clearUser)

  async function handleDeactivate() {
    if (confirmText !== CONFIRM_TEXT) {
      toast.error(`Escribe ${CONFIRM_TEXT} para confirmar`)
      return
    }

    if (!window.confirm('¿Estás seguro? Tu cuenta quedará desactivada y cerrarás sesión.')) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deactivateAccount()
      if (result.success) {
        clearUser()
        toast.success('Cuenta desactivada')
        router.push('/login')
        router.refresh()
      } else {
        toast.error(result.error ?? 'No se pudo desactivar la cuenta')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Zona peligrosa</CardTitle>
        <CardDescription>
          Desactivar tu cuenta impide el acceso a la app. El historial de la empresa se conserva.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="confirmDelete">
            Escribe <span className="font-mono font-semibold">{CONFIRM_TEXT}</span> para confirmar
          </Label>
          <Input
            id="confirmDelete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isDeleting}
            placeholder={CONFIRM_TEXT}
            autoComplete="off"
          />
        </div>
        <Button
          type="button"
          variant="destructive"
          disabled={isDeleting || confirmText !== CONFIRM_TEXT}
          onClick={() => void handleDeactivate()}
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Desactivando...
            </>
          ) : (
            'Eliminar mi cuenta'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
