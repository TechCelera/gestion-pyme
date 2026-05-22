import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ContactForm } from '../contact-form'
import { createContact, updateContact } from '@/lib/actions/contacts'
import type { ContactRow } from '@/lib/actions/contacts'

vi.mock('@/lib/actions/contacts', () => ({
  createContact: vi.fn(),
  updateContact: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSaved: vi.fn(),
}

const sampleContact: ContactRow = {
  id: 'c-1',
  name: 'Acme SA',
  kind: 'client',
  phone: '11 4444-5555',
  email: 'acme@test.com',
  taxId: '30-123',
  notes: 'Nota',
  clientSegment: 'Corp',
  associatedServices: 'Consultoría',
}

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createContact).mockResolvedValue({
      success: true,
      data: { ...sampleContact, id: 'new-1' },
    })
    vi.mocked(updateContact).mockResolvedValue({
      success: true,
      data: sampleContact,
    })
  })

  it('cliente: título, campos extra y crear deshabilitado sin obligatorios', () => {
    render(<ContactForm {...baseProps} kind="client" />)

    expect(screen.getByRole('dialog', { name: /nuevo cliente/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^nombre$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^teléfono$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/segmento/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/servicios/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear cliente/i })).toBeDisabled()
  })

  it('proveedor: sin segmento ni servicios', () => {
    render(<ContactForm {...baseProps} kind="provider" />)

    expect(screen.getByRole('dialog', { name: /nuevo proveedor/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/segmento/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/servicios/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear proveedor/i })).toBeDisabled()
  })

  it('edición: precarga datos y etiqueta Guardar', async () => {
    render(<ContactForm {...baseProps} kind="client" contact={sampleContact} />)

    expect(screen.getByRole('dialog', { name: /editar cliente/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre$/i)).toHaveValue('Acme SA')
      expect(screen.getByLabelText(/^teléfono$/i)).toHaveValue('11 4444-5555')
    })
    expect(screen.getByRole('button', { name: /^guardar$/i })).not.toBeDisabled()
  })

  it('crea cliente y notifica éxito', async () => {
    const onClose = vi.fn()
    const onSaved = vi.fn()
    render(
      <ContactForm {...baseProps} kind="client" onClose={onClose} onSaved={onSaved} />
    )

    fireEvent.change(screen.getByLabelText(/^nombre$/i), {
      target: { value: 'Nueva SA' },
    })
    fireEvent.change(screen.getByLabelText(/^teléfono$/i), {
      target: { value: '11 5555-9999' },
    })
    fireEvent.click(screen.getByRole('button', { name: /crear cliente/i }))

    await waitFor(() => {
      expect(createContact).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Nueva SA',
          phone: '11 5555-9999',
          kind: 'client',
        })
      )
    })
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
      expect(onSaved).toHaveBeenCalled()
    })
  })

  it('actualiza proveedor en edición', async () => {
    const provider: ContactRow = { ...sampleContact, id: 'p-1', kind: 'provider' }
    render(<ContactForm {...baseProps} kind="provider" contact={provider} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/^teléfono$/i)).toHaveValue('11 4444-5555')
    })

    fireEvent.change(screen.getByLabelText(/^teléfono$/i), {
      target: { value: '11 0000-1111' },
    })

    const saveBtn = screen.getByRole('button', { name: /^guardar$/i })
    await waitFor(() => expect(saveBtn).not.toBeDisabled())
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(updateContact).toHaveBeenCalledWith(
        'p-1',
        expect.objectContaining({
          phone: '11 0000-1111',
        })
      )
    })
  })
})
