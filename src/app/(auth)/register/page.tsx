import { RegisterForm } from '@/components/auth/register-form'
import { resolveRouteSearchParam } from '@/lib/next/resolve-route-search-param'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string | string[] }>
}) {
  const resolved = await searchParams
  const invite = resolveRouteSearchParam(resolved.invite)

  return <RegisterForm inviteToken={invite} />
}
