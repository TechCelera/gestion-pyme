'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { useAuthStore } from '@/stores/auth-store'
import { clearDemoCookie } from '@/lib/actions/demo-cookie'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
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
        'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-md mx-1',
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
  const router = useRouter()
  const isDemoMode = useAuthStore((state) => state.isDemoMode)
  const clearUser = useAuthStore((state) => state.clearUser)

  const supabase = createSafeBrowserClient()

  async function handleLogout() {
    try {
      if (isDemoMode) {
        clearDemoCookie().catch(() => {})
        clearUser()
        toast.success('Sesión demo cerrada')
        router.push('/login')
        router.refresh()
        return
      }

      await supabase.auth.signOut()
      toast.success('Sesión cerrada')
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  const movimientosNav: NavLink = {
    href: '/operaciones',
    label: 'Movimientos',
    icon: ArrowLeftRight,
    badge: pendingCount,
  }

  const gestionLinks: NavLink[] = [
    { href: '/cuentas', label: 'Mis cuentas', icon: Wallet },
    { href: '/reportes', label: 'Informes', icon: FileText },
    { href: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  ]

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
            {isDemoMode && (
              <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full">
                Modo Demo
              </span>
            )}
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

      <nav className="flex-1 py-2 overflow-y-auto">
        <div className="px-3 py-1">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-md',
              pathname === '/dashboard'
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
            )}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Inicio</span>}
          </Link>
        </div>

        <div className="px-3 pt-1">
          <NavRow
            item={movimientosNav}
            collapsed={collapsed}
            active={pathname === '/operaciones'}
          />
        </div>

        {!collapsed && (
          <p className="px-4 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Gestión
          </p>
        )}
        {gestionLinks.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={pathname === item.href}
          />
        ))}
      </nav>

      <div className="p-2 border-t border-border">
        <Link
          href="/configuracion"
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-md',
            pathname === '/configuracion'
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-sidebar-foreground hover:bg-sidebar-accent'
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Configuración</span>}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full rounded-md',
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
