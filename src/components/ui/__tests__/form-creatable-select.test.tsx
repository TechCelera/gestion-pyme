import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { FormCreatableSelect } from '../form-creatable-select'

describe('FormCreatableSelect', () => {
  it('muestra acción de crear cuando no hay opciones', () => {
    const onCreateNew = vi.fn()
    render(
      <FormCreatableSelect
        label="Cliente"
        htmlFor="contact-test"
        value=""
        onValueChange={() => {}}
        options={[]}
        onCreateNew={onCreateNew}
        emptyCreateLabel="Crear cliente"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Crear cliente' }))
    expect(onCreateNew).toHaveBeenCalledTimes(1)
  })

  it('muestra + Nuevo junto al label si hay opciones', () => {
    const onCreateNew = vi.fn()
    render(
      <FormCreatableSelect
        label="Cliente"
        value="1"
        onValueChange={() => {}}
        options={[{ value: '1', label: 'Acme' }]}
        onCreateNew={onCreateNew}
      />
    )

    fireEvent.click(screen.getByText('+ Nuevo'))
    expect(onCreateNew).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})
