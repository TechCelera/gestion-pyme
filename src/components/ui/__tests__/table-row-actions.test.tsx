import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Pencil, Trash2 } from 'lucide-react'

import { TableRowActions } from '../table-row-actions'

describe('TableRowActions', () => {
  it('muestra botones visibles cuando hay pocas acciones', () => {
    render(
      <TableRowActions
        actions={[
          { key: 'edit', label: 'Editar', icon: Pencil, onClick: vi.fn() },
          { key: 'delete', label: 'Eliminar', icon: Trash2, onClick: vi.fn(), destructive: true },
        ]}
      />
    )

    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Más acciones' })).not.toBeInTheDocument()
  })

  it('usa menú cuando hay más de tres acciones', () => {
    const noop = vi.fn()
    render(
      <TableRowActions
        actions={[
          { key: 'a', label: 'Uno', icon: Pencil, onClick: noop },
          { key: 'b', label: 'Dos', icon: Pencil, onClick: noop },
          { key: 'c', label: 'Tres', icon: Pencil, onClick: noop },
          { key: 'd', label: 'Cuatro', icon: Pencil, onClick: noop },
        ]}
      />
    )

    expect(screen.getByRole('button', { name: 'Más acciones' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Uno' })).not.toBeInTheDocument()
  })
})
