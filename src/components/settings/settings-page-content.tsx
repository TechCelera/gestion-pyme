'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Shield, User, Users } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/ui/page-header'
import { PageTabs, PageTabsContent } from '@/components/ui/page-tabs'
import { ProfileSection } from '@/components/settings/profile-section'
import { PasswordSection } from '@/components/settings/password-section'
import { TeamSection } from '@/components/settings/team-section'
import { SessionSection } from '@/components/settings/session-section'
import { DangerZoneSection } from '@/components/settings/danger-zone-section'
import { getProfile, type UserProfile } from '@/lib/actions/profile'
import { isAdminRole } from '@/lib/auth/roles'
import { useAuthStore } from '@/stores/auth-store'

const BASE_TABS = [
  { value: 'perfil', label: 'Perfil', icon: User },
  { value: 'seguridad', label: 'Seguridad', icon: Shield },
] as const

export function SettingsPageContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState('perfil')
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

  const isAdmin = profile ? isAdminRole(profile.role) : false
  const tabs = isAdmin
    ? [...BASE_TABS, { value: 'equipo', label: 'Equipo', icon: Users }]
    : [...BASE_TABS]

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No se pudo cargar tu perfil.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Configuración"
        description="Perfil, seguridad y equipo de tu empresa"
      />

      <PageTabs value={tab} onValueChange={setTab} tabs={[...tabs]}>
        <PageTabsContent value="perfil">
          <ProfileSection profile={profile} onUpdated={handleProfileUpdated} />
        </PageTabsContent>

        <PageTabsContent value="seguridad">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <PasswordSection currentEmail={profile.email} />
            <SessionSection />
          </div>
        </PageTabsContent>

        {isAdmin ? (
          <PageTabsContent value="equipo">
            <TeamSection currentUserId={profile.id} />
          </PageTabsContent>
        ) : null}

      </PageTabs>

      <DangerZoneSection />
    </div>
  )
}
