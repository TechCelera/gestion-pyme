import { describe, it, expect } from 'vitest'
import { sanitizeSearch } from '../sanitize'

describe('sanitizeSearch', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeSearch('')).toBe('')
  })

  it('should return empty string for whitespace-only input', () => {
    expect(sanitizeSearch('   ')).toBe('')
  })

  it('should return empty string for null input', () => {
    expect(sanitizeSearch(null as unknown as string)).toBe('')
  })

  it('should return empty string for undefined input', () => {
    expect(sanitizeSearch(undefined as unknown as string)).toBe('')
  })

  it('should return the same string for normal search terms', () => {
    expect(sanitizeSearch('hello world')).toBe('hello world')
  })

  it('should trim whitespace from input', () => {
    expect(sanitizeSearch('  test  ')).toBe('test')
  })

  it('should escape percent signs', () => {
    expect(sanitizeSearch('100%')).toBe('100\\%')
  })

  it('should escape underscores', () => {
    expect(sanitizeSearch('test_value')).toBe('test\\_value')
  })

  it('should escape both percent and underscores combined', () => {
    expect(sanitizeSearch('100%_complete')).toBe('100\\%\\_complete')
  })

  it('should handle multiple percent signs', () => {
    expect(sanitizeSearch('%%test%%')).toBe('\\%\\%test\\%\\%')
  })

  it('should handle multiple underscores', () => {
    expect(sanitizeSearch('__test__')).toBe('\\_\\_test\\_\\_')
  })

  it('should escape backslashes before escaping wildcards', () => {
    expect(sanitizeSearch('path\\test')).toBe('path\\\\test')
  })

  it('should handle complex input with all special chars', () => {
    expect(sanitizeSearch('50%_off\\sale')).toBe('50\\%\\_off\\\\sale')
  })
})