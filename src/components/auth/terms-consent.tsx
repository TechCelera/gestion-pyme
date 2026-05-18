'use client'

import Link from 'next/link'

import { Checkbox } from '@/components/ui/checkbox'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

type TermsConsentProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function TermsConsent({ checked, onCheckedChange, className }: TermsConsentProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-sm leading-snug',
        className
      )}
    >
      <Checkbox
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="mt-0.5"
        aria-describedby="terms-consent-desc"
      />
      <span id="terms-consent-desc" className="text-muted-foreground">
        Acepto los{' '}
        <Link href={ROUTES.TERMS} className="font-medium text-primary hover:underline" target="_blank">
          términos de uso
        </Link>{' '}
        y la{' '}
        <Link
          href={ROUTES.PRIVACY}
          className="font-medium text-primary hover:underline"
          target="_blank"
        >
          política de privacidad
        </Link>
        .
      </span>
    </label>
  )
}
