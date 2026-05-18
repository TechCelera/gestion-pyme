'use client'

import { TeamSection } from '@/components/settings/team-section'
import { PageHeader } from '@/components/ui/page-header'

interface EquipoPageContentProps {
  currentUserId: string
}

export function EquipoPageContent({ currentUserId }: EquipoPageContentProps) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Equipo"
        description="Invita colaboradores, envía recuperación de contraseña o elimina accesos a la empresa."
      />
      <TeamSection currentUserId={currentUserId} />
    </div>
  )
}
