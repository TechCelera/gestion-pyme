import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { MovementQuickContactDialog } from '../movement-quick-contact-dialog'

describe('MovementQuickContactDialog', () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    name: '',
    onNameChange: vi.fn(),
    phone: '',
    onPhoneChange: vi.fn(),
    email: '',
    onEmailChange: vi.fn(),
    contactKindLabel: 'cliente' as const,
    saving: false,
    onSave: vi.fn(),
  }

  it('muestra nombre, teléfono y correo opcional', () => {
    render(<MovementQuickContactDialog {...baseProps} />)

    expect(screen.getByRole('dialog', { name: /nuevo cliente/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^nombre$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^teléfono$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/segmento/i)).not.toBeInTheDocument()
  })

  it('deshabilita crear sin nombre o teléfono', () => {
    render(<MovementQuickContactDialog {...baseProps} name="Acme SA" />)

    expect(screen.getByRole('button', { name: /crear cliente/i })).toBeDisabled()
  })

  it('habilita crear con nombre y teléfono', () => {
    const onSave = vi.fn()
    render(
      <MovementQuickContactDialog
        {...baseProps}
        name="Acme SA"
        phone="11 4444-5555"
        onSave={onSave}
      />
    )

    const createBtn = screen.getByRole('button', { name: /crear cliente/i })
    expect(createBtn).not.toBeDisabled()
    fireEvent.click(createBtn)
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
