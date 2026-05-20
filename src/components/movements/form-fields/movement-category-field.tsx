'use client'

import { FormCreatableSelect } from '@/components/ui/form-controls'
import type { Category } from '@/lib/actions/categories'
import { MOVEMENT_GUIDED_FIELD_IDS } from '@/components/movements/movement-form.types'

type MovementCategoryFieldProps = {
  categoryId: string
  onCategoryIdChange: (value: string) => void
  categories: Category[]
  categoryLabel: string
  disabled?: boolean
  isLoadingData?: boolean
  onNavigateToSetup: () => void
}

export function MovementCategoryField({
  categoryId,
  onCategoryIdChange,
  categories,
  categoryLabel,
  disabled,
  isLoadingData,
  onNavigateToSetup,
}: MovementCategoryFieldProps) {
  return (
    <FormCreatableSelect
      label="Categoría"
      htmlFor={MOVEMENT_GUIDED_FIELD_IDS.category}
      alignControl
      value={categoryId}
      onValueChange={onCategoryIdChange}
      options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
      placeholder="Elige categoría"
      selectedLabel={categoryLabel}
      disabled={disabled}
      isLoading={isLoadingData}
      emptySetupLink={{
        href: '/categorias',
        label: 'Crear en Categorías',
        message: 'Sin categorías.',
        onNavigate: onNavigateToSetup,
      }}
    />
  )
}
