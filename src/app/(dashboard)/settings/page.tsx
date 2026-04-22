'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Building2, User, Bell, Shield, Palette, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const handleSave = () => {
    toast.success('Cambios guardados')
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuracion</h1>
        <p className="text-sm text-muted-foreground">
          Administra tu cuenta y preferencias
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Company Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de la Empresa</Label>
              <Input id="companyName" placeholder="Mi Empresa S.A." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">CUIT/RUT</Label>
              <Input id="taxId" placeholder="30-12345678-9" />
            </div>
            <Button onClick={handleSave} size="sm">Guardar cambios</Button>
          </CardContent>
        </Card>

        {/* User Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input id="fullName" placeholder="Juan Perez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" />
            </div>
            <Button onClick={handleSave} size="sm">Guardar cambios</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Notificaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifs" className="cursor-pointer">
                Notificaciones por email
              </Label>
              <Switch id="emailNotifs" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="pushNotifs" className="cursor-pointer">
                Notificaciones push
              </Label>
              <Switch id="pushNotifs" />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Seguridad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" size="sm">Cambiar contrasena</Button>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="2fa" className="cursor-pointer">
                Autenticacion de dos factores
              </Label>
              <Switch id="2fa" />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Apariencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode" className="cursor-pointer">
                Modo oscuro
              </Label>
              <Switch id="darkMode" />
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
            <LogOut className="h-5 w-5 text-destructive" />
            <CardTitle className="text-base text-destructive">Sesion</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" size="sm">Cerrar sesion</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
