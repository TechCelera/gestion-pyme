'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { getCompanyInvitePreview } from '@/lib/actions/company-members'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, CheckCircle, Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { COUNTRY_OPTIONS } from '@/lib/country-config'

interface RegisterFormProps {
  inviteToken?: string
}

export function RegisterForm({ inviteToken }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [country, setCountry] = useState('AR')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken)
  const [inviteCompany, setInviteCompany] = useState<string | null>(null)
  const [inviteExpired, setInviteExpired] = useState(false)
  const router = useRouter()

  const supabase = createSafeBrowserClient()
  const isInviteMode = Boolean(inviteToken && inviteCompany && !inviteExpired)

  useEffect(() => {
    if (!inviteToken) return
    let cancelled = false
    ;(async () => {
      const result = await getCompanyInvitePreview(inviteToken)
      if (cancelled) return
      if (!result.success || !result.data) {
        toast.error(result.error ?? 'Invitación inválida')
        setInviteExpired(true)
      } else if (result.data.expired) {
        toast.error('Esta invitación venció o ya fue usada')
        setInviteExpired(true)
      } else {
        setInviteCompany(result.data.companyName)
        setEmail(result.data.email)
        setFullName(result.data.fullName)
      }
      setInviteLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [inviteToken])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const metadata: Record<string, string> = {
        full_name: fullName,
        country,
      }

      if (isInviteMode && inviteToken) {
        metadata.invite_token = inviteToken
      } else {
        metadata.company_name = companyName
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      })

      if (authError) {
        toast.error(authError.message)
        return
      }

      if (authData.user) {
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData.session) {
          toast.success('Cuenta creada exitosamente')
          router.push('/dashboard')
          router.refresh()
        } else {
          setRegistered(true)
          toast.success('Cuenta creada. Revisa tu correo para confirmar.')
        }
      }
    } catch {
      toast.error('Error al crear cuenta')
    } finally {
      setLoading(false)
    }
  }

  if (inviteLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (registered) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="mb-4 flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center text-2xl font-bold text-primary">Cuenta creada</CardTitle>
            <CardDescription className="text-center">
              Revisa tu correo para confirmar tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Enviamos un enlace de confirmación a <strong>{email}</strong>
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Ir al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold text-primary">
            {isInviteMode ? 'Unirte al equipo' : 'Gestion PYME Pro'}
          </CardTitle>
          <CardDescription className="text-center">
            {isInviteMode
              ? `Te invitaron a ${inviteCompany}. Completa tu acceso.`
              : 'Crea tu cuenta y empresa'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteExpired ? (
            <p className="text-center text-sm text-destructive">
              La invitación no es válida. Pídele a tu administrador un enlace nuevo.
            </p>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {!isInviteMode ? (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre de la empresa</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Mi Empresa S.A."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="fullName">Tu nombre completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              {!isInviteMode ? (
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Select
                    value={country}
                    onValueChange={(value) => {
                      if (value) setCountry(value)
                    }}
                  >
                    <SelectTrigger id="country" className="w-full">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {COUNTRY_OPTIONS.find((c) => c.value === country)?.flag}{' '}
                        {COUNTRY_OPTIONS.find((c) => c.value === country)?.label}
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <span className="mr-2">{c.flag}</span>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username email"
                  autoCapitalize="none"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={isInviteMode}
                  className={isInviteMode ? 'bg-muted' : undefined}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : isInviteMode ? (
                  'Crear cuenta y unirme'
                ) : (
                  'Crear cuenta'
                )}
              </Button>
            </form>
          )}
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
