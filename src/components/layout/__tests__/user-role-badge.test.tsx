import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserRoleBadge } from '@/components/layout/user-role-badge'
import { useAuthStore } from '@/stores/auth-store'

describe('UserRoleBadge', () => {
  beforeEach(() => {
    useAuthStore.setState({
      userId: 'u1',
      email: 'a@test.com',
      companyId: 'c1',
      role: null,
      fullName: null,
      isAuthenticated: false,
    })
  })

  it('shows Administrador for admin role in store', () => {
    useAuthStore.setState({
      role: 'admin',
      fullName: 'Ana',
      isAuthenticated: true,
    })
    render(<UserRoleBadge />)
    expect(screen.getByText('Administrador')).toBeInTheDocument()
  })

  it('shows Colaborador for legacy vendedor slug normalized in store', () => {
    useAuthStore.setState({
      role: 'collaborator',
      isAuthenticated: true,
    })
    render(<UserRoleBadge />)
    expect(screen.getByText('Colaborador')).toBeInTheDocument()
    expect(
      screen.getByText(/Puedes crear movimientos; aprobar y anular/)
    ).toBeInTheDocument()
  })

  it('maps legacy admin_finanzas via label helper when still in store', () => {
    useAuthStore.setState({
      role: 'admin_finanzas',
      isAuthenticated: true,
    })
    render(<UserRoleBadge />)
    expect(screen.getByText('Administrador')).toBeInTheDocument()
  })
})
