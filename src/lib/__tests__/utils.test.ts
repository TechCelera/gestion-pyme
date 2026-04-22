import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn utility', () => {
  it('should merge tailwind classes', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('should handle conditional classes', () => {
    const result = cn('px-2', false && 'py-1', 'px-4')
    expect(result).toBe('px-4')
  })

  it('should handle array of classes', () => {
    const result = cn(['px-2', 'py-1'], 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('should handle object syntax', () => {
    const result = cn('base', { 'px-2': true, 'py-1': false })
    expect(result).toBe('base px-2')
  })

  it('should return empty string for no inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle undefined and null', () => {
    const result = cn('px-2', undefined, null, 'py-1')
    expect(result).toBe('px-2 py-1')
  })
})
