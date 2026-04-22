import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../card'

describe('Card Component', () => {
  it('should render card with content', () => {
    render(
      <Card>
        <CardContent>Test content</CardContent>
      </Card>
    )
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should render card with header and title', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
      </Card>
    )
    expect(screen.getByText('Card Title')).toBeInTheDocument()
  })

  it('should render card with description', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
      </Card>
    )
    expect(screen.getByText('Card description text')).toBeInTheDocument()
  })

  it('should render card with footer', () => {
    render(
      <Card>
        <CardFooter>Footer content</CardFooter>
      </Card>
    )
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('should render complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })
})
