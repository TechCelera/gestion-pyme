'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verificando tu cuenta...')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically handles the token in the URL
        // Check if we have a session after the redirect
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          setStatus('error')
          setMessage('Error al verificar tu cuenta: ' + error.message)
          toast.error('Error al confirmar cuenta')
          return
        }

        if (session) {
          // Email confirmed and logged in
          setStatus('success')
          setMessage('Cuenta verificada exitosamente')
          toast.success('Cuenta confirmada. Bienvenido!')
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          // No session but might be confirmed - redirect to login
          setStatus('success')
          setMessage('Cuenta verificada. Inicia sesión para continuar.')
          toast.success('Cuenta confirmada')
          
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        }
      } catch (err) {
        setStatus('error')
        setMessage('Error inesperado al verificar cuenta')
        toast.error('Error en verificación')
      }
    }

    handleCallback()
  }, [router, supabase.auth])

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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Cargando...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
