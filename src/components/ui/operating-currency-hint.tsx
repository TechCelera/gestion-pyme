type OperatingCurrencyHintProps = {
  currency: string
  /** Shown when an existing record still has a legacy currency label. */
  legacyCurrency?: string
  className?: string
}

export function OperatingCurrencyHint({
  currency,
  legacyCurrency,
  className,
}: OperatingCurrencyHintProps) {
  const showLegacy = legacyCurrency && legacyCurrency !== currency

  return (
    <p className={className ?? 'text-sm text-muted-foreground'}>
      Moneda de la empresa:{' '}
      <span className="font-medium text-foreground">{currency}</span>
      {showLegacy ? (
        <span className="mt-1 block text-xs text-amber-600 dark:text-amber-500">
          Al guardar, quedará en {currency} (antes {legacyCurrency}).
        </span>
      ) : null}
    </p>
  )
}
