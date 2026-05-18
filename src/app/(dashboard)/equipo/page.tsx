import { redirect } from 'next/navigation'

import { EquipoPageContent } from '@/components/team/equipo-page-content'
import { getAuthenticatedContext } from '@/lib/auth/server-context'
import { isAdminRole } from '@/lib/auth/roles'

export const dynamic = 'force-dynamic'

export default async function EquipoPage() {
  const ctx = await getAuthenticatedContext()
  if (!ctx || !isAdminRole(ctx.role)) {
    redirect('/dashboard')
  }

  return <EquipoPageContent currentUserId={ctx.userId} />
}
