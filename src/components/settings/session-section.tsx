'use client'

import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLogout } from '@/hooks/use-logout'

export function SessionSection() {
  const { logout, isDemoMode } = useLogout()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sesión</CardTitle>
        <CardDescription>
          {isDemoMode
            ? 'Salí del modo invitado y volvé a la pantalla de inicio de sesión.'
            : 'Cerrá tu sesión en este dispositivo.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => void logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </CardContent>
    </Card>
  )
}
