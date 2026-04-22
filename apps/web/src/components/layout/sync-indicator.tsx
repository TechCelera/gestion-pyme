'use client'

import { useEffect } from 'react'
import { useSyncStore } from '@/stores/sync-store'
import { Wifi, WifiOff } from 'lucide-react'

export function SyncIndicator() {
  const { isOnline, lastSyncAt, isHydrated, setOnline, setHydrated } = useSyncStore()

  // Sync online status after hydration to avoid mismatch
  useEffect(() => {
    setOnline(navigator.onLine)
    setHydrated()

    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline, setHydrated])

  // Prevent hydration mismatch - render placeholder until hydrated
  if (!isHydrated) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground bg-background border-b border-border">
        <Wifi className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
        <span>Verificando conexion...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground bg-background border-b border-border">
      {isOnline ? (
        <Wifi className="h-3.5 w-3.5 text-success" />
      ) : (
        <WifiOff className="h-3.5 w-3.5 text-destructive" />
      )}
      <span>
        {isOnline
          ? lastSyncAt
            ? `Actualizado ${lastSyncAt.toLocaleString('es-AR')}`
            : 'Conectado'
          : 'Sin conexion - cambios se guardaran localmente'}
      </span>
    </div>
  )
}