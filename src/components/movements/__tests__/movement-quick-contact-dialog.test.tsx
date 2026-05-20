import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { MovementQuickContactDialog } from '../movement-quick-contact-dialog'

describe('MovementQuickContactDialog', () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    name: '',
    onNameChange: vi.fn(),
    contactKindLabel: 'cliente' as const,
    saving: false,
    onSave: vi.fn(),
  }

  it('muestra solo el campo nombre y copy de alta mínima', () => {
    render(<MovementQuickContactDialog {...baseProps} />)

    expect(screen.getByRole('dialog', { name: /nuevo cliente/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/segmento/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/servicios/i)).not.toBeInTheDocument()
    expect(screen.getByText(/solo necesitamos el nombre/i)).toBeInTheDocument()
  })

  it('deshabilita crear si el nombre está vacío', () => {
    render(<MovementQuickContactDialog {...baseProps} />)

    expect(screen.getByRole('button', { name: /crear cliente/i })).toBeDisabled()
  })

  it('habilita crear con nombre y dispara onSave', () => {
    const onSave = vi.fn()
    render(<MovementQuickContactDialog {...baseProps} name="Acme SA" onSave={onSave} />)

    const createBtn = screen.getByRole('button', { name: /crear cliente/i })
    expect(createBtn).not.toBeDisabled()
    fireEvent.click(createBtn)
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
