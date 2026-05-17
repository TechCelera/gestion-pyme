'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  FolderKanban,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Tag,
} from 'lucide-react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLogout } from '@/hooks/use-logout'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/lib/constants'
import { UserRoleBadge } from '@/components/layout/user-role-badge'

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
  match?: (pathname: string) => boolean
}

function NavRow({
  item,
  collapsed,
  active,
}: {
  item: NavLink
  collapsed: boolean
  active: boolean
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-md',
        active
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-accent'
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <span className="flex-1 flex items-center justify-between gap-2 min-w-0">
          <span className="truncate">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 ? (
            <Badge variant="secondary" className="shrink-0 text-xs tabular-nums bg-amber-500/20 text-amber-900 dark:text-amber-100">
              {item.badge > 99 ? '99+' : item.badge}
            </Badge>
          ) : null}
        </span>
      )}
    </Link>
  )
}

export function Sidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { logout } = useLogout()

  const mainNavItems: NavLink[] = [
    {
      href: ROUTES.DASHBOARD,
      label: 'Inicio',
      icon: LayoutDashboard,
      match: (p) => p === ROUTES.DASHBOARD,
    },
    {
      href: ROUTES.MOVEMENTS,
      label: 'Movimientos',
      icon: ArrowLeftRight,
      badge: pendingCount,
      match: (p) => p === ROUTES.MOVEMENTS || p.startsWith(`${ROUTES.MOVEMENTS}/`),
    },
    {
      href: '/cuentas',
      label: 'Mis cuentas',
      icon: Wallet,
      match: (p) => p === '/cuentas' || p.startsWith('/cuentas/'),
    },
    {
      href: ROUTES.CATEGORIES,
      label: 'Categorías',
      icon: Tag,
      match: (p) => p === ROUTES.CATEGORIES || p.startsWith(`${ROUTES.CATEGORIES}/`),
    },
    {
      href: ROUTES.REPORTS,
      label: 'Informes',
      icon: FileText,
      match: (p) => p === ROUTES.REPORTS || p.startsWith(`${ROUTES.REPORTS}/`),
    },
    {
      href: '/proyectos',
      label: 'Proyectos',
      icon: FolderKanban,
      match: (p) => p === '/proyectos' || p.startsWith('/proyectos/'),
    },
  ]

  const isActive = (item: NavLink) =>
    item.match ? item.match(pathname) : pathname === item.href

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border bg-sidebar h-screen transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-primary">Gestion PYME</h1>
            <UserRoleBadge variant="compact" className="mt-1" />
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto px-2 space-y-0.5">
        {mainNavItems.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={isActive(item)}
          />
        ))}
      </nav>

      <div className="p-2 border-t border-border space-y-0.5">
        <Link
          href={ROUTES.SETTINGS}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-md',
            pathname === ROUTES.SETTINGS
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-sidebar-foreground hover:bg-sidebar-accent'
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Configuración</span>}
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full rounded-md',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
