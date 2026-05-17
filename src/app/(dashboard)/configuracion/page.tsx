'use client'

import { useState, useEffect, useCallback } from 'react'
import { Info, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { ProfileSection } from '@/components/settings/profile-section'
import { SecuritySection } from '@/components/settings/security-section'
import { DangerZoneSection } from '@/components/settings/danger-zone-section'
import { SessionSection } from '@/components/settings/session-section'
import { getProfile, type UserProfile } from '@/lib/actions/profile'
import { useAuthStore } from '@/stores/auth-store'

const DEMO_PROFILE: UserProfile = {
  id: 'demo-user-001',
  email: 'demo@gestionpyme.com',
  fullName: 'Usuario Demo',
  role: 'superadmin',
  companyId: 'demo-company-001',
  companyName: 'Empresa Demo',
  isActive: true,
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isDemoMode = useAuthStore((state) => state.isDemoMode)
  const setUser = useAuthStore((state) => state.setUser)
  const authEmail = useAuthStore((state) => state.email)
  const authFullName = useAuthStore((state) => state.fullName)
  const authRole = useAuthStore((state) => state.role)
  const authCompanyId = useAuthStore((state) => state.companyId)

  const loadProfile = useCallback(async () => {
    if (isDemoMode) {
      setProfile({
        ...DEMO_PROFILE,
        email: authEmail ?? DEMO_PROFILE.email,
        fullName: authFullName ?? DEMO_PROFILE.fullName,
        role: authRole ?? DEMO_PROFILE.role,
        companyId: authCompanyId ?? DEMO_PROFILE.companyId,
      })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await getProfile()
      if (result.success && result.data) {
        setProfile(result.data)
      } else {
        toast.error(result.error ?? 'Error al cargar el perfil')
      }
    } finally {
      setIsLoading(false)
    }
  }, [isDemoMode, authEmail, authFullName, authRole, authCompanyId])

  useEffect(() => {
    queueMicrotask(() => {
      void loadProfile()
    })
  }, [loadProfile])

  function handleProfileUpdated(fullName: string) {
    if (!profile) return
    setProfile({ ...profile, fullName })
    setUser({
      id: profile.id,
      email: profile.email,
      fullName,
      role: profile.role,
      companyId: profile.companyId,
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-muted-foreground">No se pudo cargar tu perfil.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl">
      {isDemoMode && (
        <Card className="border-[#7B68EE]/30 bg-[#7B68EE]/5">
          <CardContent className="flex items-center gap-3 py-3">
            <Info className="h-5 w-5 text-[#7B68EE] shrink-0" />
            <p className="text-sm text-foreground">
              Estás en modo demo. Los cambios de cuenta no se guardan.
            </p>
          </CardContent>
        </Card>
      )}

      <PageHeader
        title="Configuración"
        description="Tu cuenta, seguridad y preferencias personales"
      />

      <ProfileSection
        profile={profile}
        isDemoMode={isDemoMode}
        onUpdated={handleProfileUpdated}
      />

      <SecuritySection currentEmail={profile.email} isDemoMode={isDemoMode} />

      <SessionSection />

      <DangerZoneSection isDemoMode={isDemoMode} />
    </div>
  )
}
