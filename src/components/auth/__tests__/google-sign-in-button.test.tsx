import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'

describe('GoogleSignInButton', () => {
  it('muestra icono y etiqueta por defecto', () => {
    render(<GoogleSignInButton onClick={() => {}} />)
    expect(screen.getByRole('button', { name: /continuar con google/i })).toBeInTheDocument()
    expect(document.querySelector('svg[aria-hidden="true"]')).toBeTruthy()
  })

  it('llama onClick al pulsar', () => {
    const onClick = vi.fn()
    render(<GoogleSignInButton onClick={onClick} label="Registrarse con Google" />)
    fireEvent.click(screen.getByRole('button', { name: /registrarse con google/i }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
