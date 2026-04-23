'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, UserCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createSafeBrowserClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        toast.success('Inicio de sesión exitoso')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      toast.error('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const setDemoUser = useAuthStore((state) => state.setDemoUser)

  async function handleDemoLogin() {
    setLoading(true)

    try {
      // Intentar login con Supabase primero
      const demoEmail = 'demo@gestionpyme.com'
      const demoPassword = 'Demo123!'

      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      })

      if (!error && data.user) {
        // Login exitoso con Supabase
        toast.success('Modo Demo activado - Explora con datos de prueba')
        router.push('/dashboard')
        router.refresh()
        return
      }

      // Si falla Supabase, usar modo demo local
      setDemoUser()
      toast.success('Modo Demo Offline activado - Datos locales de prueba')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      // Fallback a modo demo local
      setDemoUser()
      toast.success('Modo Demo Offline activado - Datos locales de prueba')
      router.push('/dashboard')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Gestion PYME Pro
          </CardTitle>
          <CardDescription className="text-center">
            Inicia sesión en tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#7B68EE] hover:bg-[#7B68EE]/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O prueba el demo
                </span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline"
              className="w-full border-dashed border-2 hover:border-[#7B68EE] hover:text-[#7B68EE]"
              disabled={loading}
              onClick={handleDemoLogin}
            >
              <UserCircle className="mr-2 h-4 w-4" />
              Entrar como Invitado (Demo)
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}