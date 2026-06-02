'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { getCompanyInvitePreview } from '@/lib/actions/company-members'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { CheckCircle, Globe, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { COUNTRY_OPTIONS } from '@/lib/country-config'
import { ROUTES } from '@/lib/constants'
import {
  isSignUpDuplicateEmail,
  mapGoogleOAuthStartError,
  mapSignUpErrorMessage,
  normalizeAuthEmail,
  validateTermsAccepted,
} from '@/lib/validations/auth'
import {
  validateRegisterCompanyName,
  validateRegisterPasswords,
} from '@/lib/validations/register'
import { getClientAppOrigin } from '@/lib/utils/app-origin'
import { startGoogleOAuth } from '@/lib/auth/google-oauth'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthSubmitButton } from '@/components/auth/auth-submit-button'
import { AuthFooterLink } from '@/components/auth/auth-footer-link'
import { PasswordStrengthHint } from '@/components/auth/password-strength-hint'
import { TermsConsent } from '@/components/auth/terms-consent'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { AuthMethodDivider } from '@/components/auth/auth-method-divider'
import { AuthGoogleHint } from '@/components/auth/auth-google-hint'
import { CompleteAccountFields } from '@/components/auth/complete-account-fields'
import { useAuthCompletionView } from '@/components/auth/use-auth-completion-view'
import { Button } from '@/components/ui/button'

interface RegisterFormProps {
  inviteToken?: string
}

export function RegisterForm({ inviteToken }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [country, setCountry] = useState('AR')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken)
  const [inviteCompany, setInviteCompany] = useState<string | null>(null)
  const [inviteExpired, setInviteExpired] = useState(false)
  const router = useRouter()
  const { view: completionView, prefill, nextPath } = useAuthCompletionView()

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

  async function handleGoogleRegister() {
    setGoogleLoading(true)
    try {
      const result = await startGoogleOAuth({
        returnSurface: 'register',
        nextPath: ROUTES.DASHBOARD,
        metadata: { country },
      })
      if (!result.ok) {
        toast.error(mapGoogleOAuthStartError(result.error))
        setGoogleLoading(false)
      }
    } catch {
      toast.error(mapGoogleOAuthStartError())
      setGoogleLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    const trimmedEmail = normalizeAuthEmail(email)
    const trimmedFullName = fullName.trim()
    const trimmedCompanyName = companyName.trim()

    const termsError = validateTermsAccepted(acceptedTerms)
    if (termsError) {
      toast.error(termsError)
      return
    }

    const companyError = validateRegisterCompanyName(trimmedCompanyName, isInviteMode)
    if (companyError) {
      toast.error(companyError)
      return
    }

    const passwordError = validateRegisterPasswords(password, confirmPassword)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    if (!trimmedFullName) {
      toast.error('Ingresá tu nombre completo')
      return
    }

    setLoading(true)

    try {
      const metadata: Record<string, string | boolean> = {
        full_name: trimmedFullName,
        country,
        profile_completed: true,
      }

      if (isInviteMode && inviteToken) {
        metadata.invite_token = inviteToken
      } else {
        metadata.company_name = trimmedCompanyName
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${getClientAppOrigin()}${ROUTES.AUTH_CALLBACK}`,
        },
      })

      if (authError) {
        toast.error(mapSignUpErrorMessage(authError))
        return
      }

      if (authData.user) {
        if (isSignUpDuplicateEmail(authData.user)) {
          setRegisteredEmail(trimmedEmail)
          setRegistered(true)
          toast.success('Si el correo es válido, recibirás un mensaje para continuar.')
          return
        }

        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData.session) {
          toast.success('Cuenta creada exitosamente')
          router.push('/dashboard')
          router.refresh()
        } else {
          setRegisteredEmail(trimmedEmail)
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
      <AuthShell title="Cargando invitación" description="Validando tu enlace…">
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthShell>
    )
  }

  if (!isInviteMode && !registered && completionView === 'loading') {
    return (
      <AuthShell title="Gestion PYME Pro" description="Cargando…">
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthShell>
    )
  }

  if (!isInviteMode && !registered && completionView === 'complete' && prefill) {
    return (
      <AuthShell
        title="Terminemos tu registro"
        description="Completá tu empresa en este paso para entrar al panel."
        footer={
          <AuthFooterLink prompt="¿Ya tienes cuenta?" href={ROUTES.LOGIN} linkLabel="Inicia sesión" />
        }
      >
        <CompleteAccountFields
          prefill={prefill}
          nextPath={nextPath}
          submitLabel="Crear mi empresa"
        />
      </AuthShell>
    )
  }

  if (registered) {
    return (
      <AuthShell
        title="Cuenta creada"
        description="Revisa tu correo para confirmar tu cuenta"
        footer={
          <AuthFooterLink prompt="¿Ya confirmaste?" href={ROUTES.LOGIN} linkLabel="Iniciar sesión" />
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle className="h-14 w-14 text-emerald-500" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Enviamos un enlace de confirmación a{' '}
            <strong className="text-foreground">{registeredEmail}</strong>
          </p>
          <Button onClick={() => router.push(ROUTES.LOGIN)} className="h-10 w-full">
            Ir al inicio de sesión
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={isInviteMode ? 'Unirte al equipo' : 'Gestion PYME Pro'}
      description={
        isInviteMode
          ? `Te invitaron a ${inviteCompany}. Completa tu acceso.`
          : 'Crea tu cuenta y empresa en minutos.'
      }
      footer={
        <AuthFooterLink prompt="¿Ya tienes cuenta?" href={ROUTES.LOGIN} linkLabel="Inicia sesión" />
      }
    >
      {inviteExpired ? (
        <p className="text-center text-sm text-destructive">
          La invitación no es válida. Pídele a tu administrador un enlace nuevo.
        </p>
      ) : (
        <div className="space-y-4">
          {!isInviteMode ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Select
                  value={country}
                  onValueChange={(value) => {
                    if (value) setCountry(value)
                  }}
                >
                  <SelectTrigger id="country" className="h-10 w-full">
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
              <div className="space-y-2">
                <GoogleSignInButton
                  onClick={handleGoogleRegister}
                  loading={googleLoading}
                  disabled={loading}
                  label="Registrarse con Google"
                  loadingLabel="Conectando con Google…"
                />
                <AuthGoogleHint variant="register" />
              </div>
              <AuthMethodDivider label="o completa el formulario" />
            </>
          ) : null}

          <form onSubmit={handleRegister} className="space-y-4" autoComplete="on">
          {!isInviteMode ? (
            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de la empresa</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Mi Empresa S.A."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-10"
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
              className="h-10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username email"
              autoCapitalize="none"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={isInviteMode}
              className={isInviteMode ? 'h-10 bg-muted' : 'h-10'}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="Letras y números, mínimo 8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="h-10"
              required
            />
            <PasswordStrengthHint password={password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirm-password"
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              className="h-10"
              required
            />
          </div>
          <TermsConsent checked={acceptedTerms} onCheckedChange={setAcceptedTerms} />
          <AuthSubmitButton
            loading={loading}
            loadingLabel="Creando cuenta..."
            disabled={googleLoading}
          >
            {isInviteMode ? 'Crear cuenta y unirme' : 'Crear cuenta'}
          </AuthSubmitButton>
        </form>
        </div>
      )}
    </AuthShell>
  )
}
