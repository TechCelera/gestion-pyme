import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { MovementFormFooter } from '../movement-form-footer'

const baseProps = {
  isGuidedCreate: true,
  isLoading: false,
  isEditing: false,
  isRejectedCorrection: false,
  accountsEmpty: false,
  type: 'income' as const,
  accountId: 'acc-1',
  categoryId: 'cat-1',
  sumMatchesComponents: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
}

describe('MovementFormFooter', () => {
  it('shows Enviar a aprobación and Borrador when creating', () => {
    render(<MovementFormFooter {...baseProps} />)

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Borrador' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar a aprobación' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /aprobar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /revisión/i })).not.toBeInTheDocument()
  })

  it('hides Borrador when editing', () => {
    render(<MovementFormFooter {...baseProps} isEditing />)

    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Borrador' })).not.toBeInTheDocument()
  })

  it('calls onSubmit(false) on primary click', () => {
    const onSubmit = vi.fn()
    render(<MovementFormFooter {...baseProps} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enviar a aprobación' }))
    expect(onSubmit).toHaveBeenCalledWith(false)
  })

  it('calls onSubmit(true) on draft click', () => {
    const onSubmit = vi.fn()
    render(<MovementFormFooter {...baseProps} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Borrador' }))
    expect(onSubmit).toHaveBeenCalledWith(true)
  })

  it('disables primary when account or category missing', () => {
    render(
      <MovementFormFooter {...baseProps} accountId="" categoryId="cat-1" />
    )
    expect(screen.getByRole('button', { name: 'Enviar a aprobación' })).toBeDisabled()
  })
})
