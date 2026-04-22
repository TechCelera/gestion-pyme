import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SyncState {
  lastSyncAt: Date | null
  isOnline: boolean
  isHydrated: boolean
  setLastSync: (date: Date) => void
  setOnline: (online: boolean) => void
  setHydrated: () => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      lastSyncAt: null,
      isOnline: true, // Default consistent server/client
      isHydrated: false,
      setLastSync: (date: Date) => set({ lastSyncAt: date }),
      setOnline: (online: boolean) => set({ isOnline: online }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    { name: 'gestion-pyme-sync' }
  )
)
