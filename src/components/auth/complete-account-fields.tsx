'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'
import { toast } from 'sonner'

import {
  completeAccountAction,
  type AccountCompletionPrefill,
} from '@/lib/actions/complete-account'
import { navigateAfterAuth } from '@/lib/auth/post-auth-navigation'
import { COUNTRY_OPTIONS } from '@/lib/country-config'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { AuthSubmitButton } from '@/components/auth/auth-submit-button'
import { TermsConsent } from '@/components/auth/terms-consent'
import type { ActionResult } from '@/lib/actions/types'

type CompleteAccountFieldsProps = {
  prefill: AccountCompletionPrefill
  nextPath: string
  submitLabel?: string
}

/** Formulario inline en login/registro (misma pantalla tras Google). */
export function CompleteAccountFields({
  prefill,
  nextPath,
  submitLabel = 'Entrar a mi empresa',
}: CompleteAccountFieldsProps) {
  const [fullName, setFullName] = useState(prefill.fullName)
  const [companyName, setCompanyName] = useState(prefill.companyName)
  const [country, setCountry] = useState(prefill.country)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result: ActionResult<{ redirectTo: string }> = await completeAccountAction({
        fullName,
        companyName,
        country,
        acceptedTerms,
      })

      if (!result.success || !result.data) {
        toast.error(result.success ? 'Error inesperado' : result.error)
        return
      }

      toast.success('Listo, ya podés usar Gestion PYME Pro')
      navigateAfterAuth(nextPath || result.data.redirectTo)
    } catch {
      toast.error('No pudimos guardar tus datos. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
      <p className="text-sm text-muted-foreground">
        Google confirmó tu correo. Completá estos datos para activar tu empresa ahora.
      </p>
      <div className="space-y-2">
        <Label htmlFor="complete-email">Correo</Label>
        <Input
          id="complete-email"
          type="email"
          value={prefill.email}
          readOnly
          className="h-10 bg-muted"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="complete-company">Nombre de la empresa</Label>
        <Input
          id="complete-company"
          type="text"
          placeholder="Ej: Distribuidora Norte"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          disabled={loading}
          className="h-10"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="complete-fullName">Tu nombre completo</Label>
        <Input
          id="complete-fullName"
          type="text"
          placeholder="Juan Pérez"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={loading}
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="complete-country">País</Label>
        <Select
          value={country}
          onValueChange={(value) => {
            if (value) setCountry(value)
          }}
        >
          <SelectTrigger id="complete-country" className="h-10 w-full" disabled={loading}>
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
      <TermsConsent checked={acceptedTerms} onCheckedChange={setAcceptedTerms} />
      <AuthSubmitButton loading={loading} loadingLabel="Guardando…" disabled={!acceptedTerms}>
        {submitLabel}
      </AuthSubmitButton>
    </form>
  )
}
