import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

import { RegisterForm } from '@/components/auth/register-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { resolveRouteSearchParam } from '@/lib/next/resolve-route-search-param'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string | string[] }>
}) {
  const resolved = await searchParams
  const invite = resolveRouteSearchParam(resolved.invite)

  return (
    <Suspense
      fallback={
        <AuthShell title="Gestion PYME Pro" description="Cargando…">
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
          </div>
        </AuthShell>
      }
    >
      <RegisterForm inviteToken={invite} />
    </Suspense>
  )
}
