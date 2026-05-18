import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AuthSubmitButtonProps = {
  loading?: boolean
  loadingLabel: string
  children: ReactNode
  className?: string
}

export function AuthSubmitButton({
  loading,
  loadingLabel,
  children,
  className,
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      className={cn(
        'h-10 w-full bg-[#7B68EE] text-white hover:bg-[#7B68EE]/90',
        className
      )}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
