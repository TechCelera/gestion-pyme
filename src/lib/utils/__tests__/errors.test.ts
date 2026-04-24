import { describe, it, expect } from 'vitest'
import { categorizeError } from '../errors'
import { ZodError, z } from 'zod'

describe('categorizeError', () => {
  describe('auth errors', () => {
    it('should detect "no autenticado" as auth error', () => {
      const result = categorizeError(new Error('Usuario no autenticado'))
      expect(result.category).toBe('auth')
      expect(result.message).toContain('sesión')
    })

    it('should detect "not authenticated" as auth error', () => {
      const result = categorizeError(new Error('User not authenticated'))
      expect(result.category).toBe('auth')
    })

    it('should detect JWT errors as auth error', () => {
      const result = categorizeError(new Error('JWT expired'))
      expect(result.category).toBe('auth')
    })

    it('should detect session errors as auth error', () => {
      const result = categorizeError(new Error('Invalid session token'))
      expect(result.category).toBe('auth')
    })

    it('should detect "unauthorized" as auth error', () => {
      const result = categorizeError(new Error('Unauthorized access'))
      expect(result.category).toBe('auth')
    })

    it('should detect "no autorizado" as auth error', () => {
      const result = categorizeError(new Error('Usuario no autorizado'))
      expect(result.category).toBe('auth')
    })

    it('should detect token errors as auth error', () => {
      const result = categorizeError(new Error('Token is invalid'))
      expect(result.category).toBe('auth')
    })

    it('should return Spanish message for auth errors', () => {
      const result = categorizeError(new Error('JWT expired'))
      expect(result.message).toBe('Tu sesión ha expirado')
      expect(result.action).toContain('Inicia sesión')
    })
  })

  describe('database errors', () => {
    it('should detect "database" as database error', () => {
      const result = categorizeError(new Error('Database connection failed'))
      expect(result.category).toBe('database')
    })

    it('should detect "rpc" as database error', () => {
      const result = categorizeError(new Error('RPC function not found'))
      expect(result.category).toBe('database')
    })

    it('should detect "company_id" as database error', () => {
      const result = categorizeError(new Error('company_id constraint violation'))
      expect(result.category).toBe('database')
    })

    it('should detect "RLS" as database error', () => {
      const result = categorizeError(new Error('RLS policy violation'))
      expect(result.category).toBe('database')
    })

    it('should detect "permission" as database error', () => {
      const result = categorizeError(new Error('Permission denied for table'))
      expect(result.category).toBe('database')
    })

    it('should detect PERIOD_CLOSED as database error', () => {
      const result = categorizeError(new Error('PERIOD_CLOSED: El período está cerrado'))
      expect(result.category).toBe('database')
    })

    it('should detect TRANSACTION_NOT_FOUND as database error', () => {
      const result = categorizeError(new Error('TRANSACTION_NOT_FOUND: Transacción no encontrada'))
      expect(result.category).toBe('database')
    })
  })

  describe('validation errors', () => {
    it('should detect ZodError as validation error', () => {
      const schema = z.object({ name: z.string().min(3) })
      const result = schema.safeParse({ name: 'ab' })
      if (!result.success) {
        const categorized = categorizeError(result.error)
        expect(categorized.category).toBe('validation')
      }
    })

    it('should detect "invalid" as validation error', () => {
      const result = categorizeError(new Error('Invalid input data'))
      expect(result.category).toBe('validation')
    })

    it('should detect "required" as validation error', () => {
      const result = categorizeError(new Error('Field is required'))
      expect(result.category).toBe('validation')
    })
  })

  describe('network errors', () => {
    it('should detect "network" as network error', () => {
      const result = categorizeError(new Error('Network error'))
      expect(result.category).toBe('network')
    })

    it('should detect "fetch" as network error', () => {
      const result = categorizeError(new Error('Failed to fetch data'))
      expect(result.category).toBe('network')
    })

    it('should detect "timeout" as network error', () => {
      const result = categorizeError(new Error('Request timeout'))
      expect(result.category).toBe('network')
    })

    it('should return Spanish message for network errors', () => {
      const result = categorizeError(new Error('Network error'))
      expect(result.message).toContain('conexión')
    })
  })

  describe('unknown errors', () => {
    it('should categorize unknown errors', () => {
      const result = categorizeError(new Error('Something unexpected happened'))
      expect(result.category).toBe('unknown')
      expect(result.message).toBe('Something unexpected happened')
    })

    it('should handle null input', () => {
      const result = categorizeError(null)
      expect(result.category).toBe('unknown')
      expect(result.message).toBe('Error desconocido')
    })

    it('should handle undefined input', () => {
      const result = categorizeError(undefined)
      expect(result.category).toBe('unknown')
    })

    it('should handle string errors', () => {
      const result = categorizeError('No autenticado')
      expect(result.category).toBe('auth')
    })

    it('should handle unknown string errors', () => {
      const result = categorizeError('some random error string')
      expect(result.category).toBe('unknown')
      expect(result.message).toBe('some random error string')
    })

    it('should handle number errors', () => {
      const result = categorizeError(42)
      expect(result.category).toBe('unknown')
    })
  })
})