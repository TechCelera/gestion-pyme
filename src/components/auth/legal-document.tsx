import type { ReactNode } from 'react'
import Link from 'next/link'

import { AuthShell } from '@/components/auth/auth-shell'
import { ROUTES } from '@/lib/constants'

type LegalDocumentProps = {
  title: string
  children: ReactNode
}

export function LegalDocument({ title, children }: LegalDocumentProps) {
  return (
    <AuthShell
      title={title}
      description="Documento informativo para usuarios de Gestion PYME Pro."
      footer={
        <p className="text-center text-sm">
          <Link href={ROUTES.REGISTER} className="font-medium text-primary hover:underline">
            Volver al registro
          </Link>
          {' · '}
          <Link href={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <div>{children}</div>
    </AuthShell>
  )
}
