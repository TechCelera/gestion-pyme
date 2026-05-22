'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { COUNTRY_OPTIONS } from '@/lib/country-config'
import { currencyLabelForCountry } from '@/lib/company-operating-currency'
import {
  getCompanySettings,
  updateCompanyCountry,
  type CompanySettings,
} from '@/lib/actions/company-settings'

type CompanySettingsSectionProps = {
  isAdmin: boolean
}

export function CompanySettingsSection({ isAdmin }: CompanySettingsSectionProps) {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [country, setCountry] = useState('AR')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getCompanySettings()
      if (res.success && res.data) {
        setSettings(res.data)
        setCountry(res.data.country)
      } else {
        toast.error(res.error ?? 'No se pudo cargar la empresa')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void load()
    })
  }, [load])

  async function handleSave() {
    if (!settings?.canChangeCountry) return
    setIsSaving(true)
    try {
      const res = await updateCompanyCountry(country)
      if (res.success && res.data) {
        setSettings(res.data)
        setCountry(res.data.country)
        toast.success('País y moneda actualizados')
      } else {
        toast.error(res.error ?? 'No se pudo guardar')
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!settings) {
    return <p className="text-sm text-muted-foreground">No se pudo cargar la configuración.</p>
  }

  const currencyHint = currencyLabelForCountry(country)
  const locked = !settings.canChangeCountry

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5" />
          Empresa
        </CardTitle>
        <CardDescription>
          Moneda operativa única para movimientos y cuentas. Se define según el país de la empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{settings.companyName}</p>
          <p className="text-sm text-muted-foreground">
            Moneda actual: <span className="font-medium text-foreground">{settings.currency}</span>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-country">País</Label>
          <Select
            value={country}
            onValueChange={(v) => setCountry(v ?? settings.country)}
            disabled={!isAdmin || locked || isSaving}
          >
            <SelectTrigger id="company-country" className="w-full max-w-sm">
              <SelectValue>
                {COUNTRY_OPTIONS.find((c) => c.value === country)?.flag}{' '}
                {COUNTRY_OPTIONS.find((c) => c.value === country)?.label ?? country}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.flag} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Moneda operativa: {currencyHint}
          </p>
        </div>

        {locked ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
            Ya hay movimientos registrados. El país y la moneda no se pueden cambiar para no
            mezclar montos históricos.
          </p>
        ) : !isAdmin ? (
          <p className="text-sm text-muted-foreground">
            Solo un administrador puede cambiar el país antes del primer movimiento.
          </p>
        ) : (
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || country === settings.country}
          >
            {isSaving ? 'Guardando…' : 'Guardar país'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
