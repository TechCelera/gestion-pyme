'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, FileText, Settings, FolderKanban, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { CompanyOperatingProfile } from '@/lib/company-operating-profile'
import { shouldShowDashboardNavItem } from '@/lib/navigation/dashboard-nav'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, match: (p: string) => p === '/dashboard' },
  { href: '/operaciones', label: 'Movimientos', icon: ArrowLeftRight, match: (p: string) => p === '/operaciones' },
  { href: '/cuentas', label: 'Cuentas', icon: Wallet, match: (p: string) => p === '/cuentas' },
  { href: '/proyectos', label: 'Proyectos', icon: FolderKanban, match: (p: string) => p === '/proyectos' },
  { href: '/reportes', label: 'Informes', icon: FileText, match: (p: string) => p === '/reportes' },
  { href: '/configuracion', label: 'Ajustes', icon: Settings, match: (p: string) => p === '/configuracion' },
]

export function BottomNav({
  pendingCount = 0,
  operatingProfile = 'default',
  isAdmin = true,
}: {
  pendingCount?: number
  operatingProfile?: CompanyOperatingProfile
  isAdmin?: boolean
}) {
  const pathname = usePathname()
  const visibleNavItems = navItems.filter((item) =>
    shouldShowDashboardNavItem(item.href, operatingProfile, isAdmin)
  )

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around h-16">
        {visibleNavItems.map((item) => {
          const isOperaciones = item.href === '/operaciones'
          const active = isOperaciones ? pathname === '/operaciones' : item.match(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                active ? 'text-primary font-medium' : 'text-muted-foreground'
              )}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {isOperaciones && pendingCount > 0 ? (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-2 h-4 min-w-4 px-0.5 flex items-center justify-center text-[9px] p-0 bg-amber-500 text-amber-950 border-0"
                  >
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </Badge>
                ) : null}
              </span>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
