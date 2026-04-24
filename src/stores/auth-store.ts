import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clearDemoCookie } from '@/lib/actions/demo-cookie'

interface User {
  id: string
  email: string
  companyId: string
  role: string
  fullName: string
}

interface AuthState {
  userId: string | null
  companyId: string | null
  role: string | null
  fullName: string | null
  email: string | null
  isAuthenticated: boolean
  isDemoMode: boolean
  setUser: (user: User | null) => void
  setDemoUser: () => void
  clearUser: () => void
}

const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@gestionpyme.com',
  companyId: 'demo-company-001',
  role: 'admin',
  fullName: 'Usuario Demo',
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      companyId: null,
      role: null,
      fullName: null,
      email: null,
      isAuthenticated: false,
      isDemoMode: false,
      setUser: (user) =>
        set({
          userId: user?.id ?? null,
          email: user?.email ?? null,
          companyId: user?.companyId ?? null,
          role: user?.role ?? null,
          fullName: user?.fullName ?? null,
          isAuthenticated: !!user,
          isDemoMode: false,
        }),
      setDemoUser: () =>
        set({
          userId: DEMO_USER.id,
          email: DEMO_USER.email,
          companyId: DEMO_USER.companyId,
          role: DEMO_USER.role,
          fullName: DEMO_USER.fullName,
          isAuthenticated: true,
          isDemoMode: true,
        }),
      clearUser: () => {
        set({
          userId: null,
          email: null,
          companyId: null,
          role: null,
          fullName: null,
          isAuthenticated: false,
          isDemoMode: false,
        })
        // Limpiar cookie de demo en paralelo (no bloquea)
        clearDemoCookie().catch(() => {})
      },
    }),
    { name: 'gestion-pyme-auth' }
  )
)