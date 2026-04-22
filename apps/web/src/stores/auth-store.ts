import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  setUser: (user: User | null) => void
  clearUser: () => void
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
      setUser: (user) =>
        set({
          userId: user?.id ?? null,
          email: user?.email ?? null,
          companyId: user?.companyId ?? null,
          role: user?.role ?? null,
          fullName: user?.fullName ?? null,
          isAuthenticated: !!user,
        }),
      clearUser: () =>
        set({
          userId: null,
          email: null,
          companyId: null,
          role: null,
          fullName: null,
          isAuthenticated: false,
        }),
    }),
    { name: 'gestion-pyme-auth' }
  )
)