'use client'

import { FormCreatableSelect } from '@/components/ui/form-controls'
import type { Account } from '@/lib/actions/accounts'
import { MOVEMENT_GUIDED_FIELD_IDS } from '@/components/movements/movement-form.types'

type MovementAccountFieldProps = {
  label: string
  accountId: string
  onAccountIdChange: (value: string) => void
  accounts: Account[]
  accountLabel: string
  disabled?: boolean
  isLoadingData?: boolean
  onNavigateToSetup: () => void
}

export function MovementAccountField({
  label,
  accountId,
  onAccountIdChange,
  accounts,
  accountLabel,
  disabled,
  isLoadingData,
  onNavigateToSetup,
}: MovementAccountFieldProps) {
  return (
    <FormCreatableSelect
      label={label}
      htmlFor={MOVEMENT_GUIDED_FIELD_IDS.account}
      alignControl
      value={accountId}
      onValueChange={onAccountIdChange}
      options={accounts.map((account) => ({
        value: account.id,
        label: `${account.name} (${account.currency})`,
      }))}
      placeholder="Elige cuenta"
      selectedLabel={accountLabel}
      disabled={disabled}
      isLoading={isLoadingData}
      emptySetupLink={{
        href: '/cuentas',
        label: 'Crear cuenta',
        onNavigate: onNavigateToSetup,
      }}
    />
  )
}
