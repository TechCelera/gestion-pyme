import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('should render with variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('should render with size', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByText('Small')).toBeInTheDocument()
  })
})
