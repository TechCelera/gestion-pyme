import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import {
  FormSheet,
  FormSheetActions,
  FormSheetBody,
  FormSheetCancelButton,
  FormSheetFooter,
  FormSheetHeader,
  FormSheetSubmitButton,
} from '../form-sheet'

describe('FormSheetActions', () => {
  it('renderiza cancelar y enviar con pie parametrizado', () => {
    render(
      <FormSheet open onClose={vi.fn()}>
        <FormSheetActions
          onCancel={vi.fn()}
          onSubmit={vi.fn()}
          submitLabel="Crear cliente"
        />
      </FormSheet>
    )

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear cliente' })).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sheet-form-footer"]')).toBeInTheDocument()
  })

  it('deshabilita enviar cuando submitDisabled', () => {
    render(
      <FormSheet open onClose={vi.fn()}>
        <FormSheetActions
          onCancel={vi.fn()}
          onSubmit={vi.fn()}
          submitLabel="Guardar"
          submitDisabled
        />
      </FormSheet>
    )

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('muestra Guardando... y deshabilita ambos al guardar', () => {
    render(
      <FormSheet open onClose={vi.fn()}>
        <FormSheetActions
          onCancel={vi.fn()}
          onSubmit={vi.fn()}
          submitLabel="Crear proveedor"
          isSaving
        />
      </FormSheet>
    )

    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  it('dispara onCancel y onSubmit', () => {
    const onCancel = vi.fn()
    const onSubmit = vi.fn()
    render(
      <FormSheet open onClose={vi.fn()}>
        <FormSheetActions
          onCancel={onCancel}
          onSubmit={onSubmit}
          submitLabel="Crear cuenta"
        />
      </FormSheet>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})

describe('FormSheet layout', () => {
  it('header y body con slots de formulario', () => {
    render(
      <FormSheet open onClose={vi.fn()} maxWidth="md">
        <FormSheetHeader title="Nuevo cliente" description="Ayuda" />
        <FormSheetBody>
          <p>Campo demo</p>
        </FormSheetBody>
      </FormSheet>
    )

    expect(screen.getByText('Nuevo cliente')).toBeInTheDocument()
    expect(screen.getByText('Ayuda')).toBeInTheDocument()
    expect(screen.getByText('Campo demo')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sheet-form-header"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sheet-form-body"]')).toBeInTheDocument()
  })

  it('footer custom usa grid de dos columnas por defecto', () => {
    render(
      <FormSheet open onClose={vi.fn()}>
        <FormSheetFooter>
          <FormSheetCancelButton>Cancelar</FormSheetCancelButton>
          <FormSheetSubmitButton tone="accent">Guardar</FormSheetSubmitButton>
        </FormSheetFooter>
      </FormSheet>
    )

    const footer = document.querySelector('[data-slot="sheet-form-footer"]')
    expect(footer).toHaveClass('grid-cols-2')
  })
})
