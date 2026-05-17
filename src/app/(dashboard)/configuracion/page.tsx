'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/ui/page-header'
import { ProfileSection } from '@/components/settings/profile-section'
import { SecuritySection } from '@/components/settings/security-section'
import { DangerZoneSection } from '@/components/settings/danger-zone-section'
import { SessionSection } from '@/components/settings/session-section'
import { getProfile, type UserProfile } from '@/lib/actions/profile'
import { useAuthStore } from '@/stores/auth-store'

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const setUser = useAuthStore((state) => state.setUser)

  const loadProfile = useCallback(async () => {
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
  }, [])

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
      <PageHeader
        title="Configuración"
        description="Tu cuenta, seguridad y preferencias personales"
      />

      <ProfileSection profile={profile} onUpdated={handleProfileUpdated} />

      <SecuritySection currentEmail={profile.email} />

      <SessionSection />

      <DangerZoneSection />
    </div>
  )
}
