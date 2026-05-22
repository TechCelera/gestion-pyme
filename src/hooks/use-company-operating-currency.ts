'use client'

import { useCallback, useEffect, useState } from 'react'

import { getCompanyOperatingCurrency } from '@/lib/actions/company-settings'
import { currencyForCountry } from '@/lib/company-operating-currency'

const FALLBACK_CURRENCY = currencyForCountry('AR')

export function useCompanyOperatingCurrency(isActive: boolean) {
  const [currency, setCurrency] = useState(FALLBACK_CURRENCY)
  const [isLoading, setIsLoading] = useState(false)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getCompanyOperatingCurrency()
      if (res.success && res.data) {
        setCurrency(res.data)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isActive) return
    queueMicrotask(() => {
      void reload()
    })
  }, [isActive, reload])

  return { currency, isLoading, reload }
}
