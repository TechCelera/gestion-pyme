'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verificando tu cuenta...')

  useEffect(() => {
    const supabase = createSafeBrowserClient()

    const handleCallback = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          setStatus('error')
          setMessage('Error al verificar tu cuenta: ' + error.message)
          toast.error('Error al confirmar cuenta')
          return
        }

        if (session) {
          setStatus('success')
          setMessage('Cuenta verificada exitosamente')
          toast.success('Cuenta confirmada. Bienvenido!')

          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          setStatus('success')
          setMessage('Cuenta verificada. Inicia sesión para continuar.')
          toast.success('Cuenta confirmada')

          setTimeout(() => {
            router.push('/login')
          }, 2000)
        }
      } catch {
        setStatus('error')
        setMessage('Error inesperado al verificar cuenta')
        toast.error('Error en verificación')
      }
    }

    void handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-primary">
                Verificando cuenta
              </CardTitle>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-primary">
                Cuenta verificada
              </CardTitle>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-primary">
                Error de verificación
              </CardTitle>
            </>
          )}
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'error' && (
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Ir al inicio de sesión
            </Button>
          )}
          {status === 'success' && (
            <p className="text-center text-sm text-muted-foreground">
              Redirigiendo...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
