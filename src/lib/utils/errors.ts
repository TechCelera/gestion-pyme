import { ZodError } from 'zod'

/**
 * Primer mensaje legible para UI y `ActionResult.error`.
 * Evita mostrar el JSON que en algunas versiones de Zod va en `ZodError.message`.
 */
export function errorMessageForUser(
  error: unknown,
  fallback = 'Error desconocido'
): string {
  if (error instanceof ZodError) {
    const first = error.issues[0]
    return first?.message ?? fallback
  }
  if (error instanceof Error) {
    return error.message || fallback
  }
  return fallback
}

/**
 * Error categories for user-facing error messages.
 */
export type ErrorCategory = 'auth' | 'database' | 'validation' | 'network' | 'unknown'

export interface CategorizedError {
  category: ErrorCategory
  message: string
  action: string
}

/**
 * Categorizes an unknown error into a structured format with
 * Spanish-language messages suitable for UI display.
 *
 * @param error - The error to categorize (can be any type)
 * @returns Categorized error with category, user message, and suggested action
 */
export function categorizeError(error: unknown): CategorizedError {
  // Handle null/undefined
  if (error == null) {
    return {
      category: 'unknown',
      message: 'Error desconocido',
      action: 'Intenta de nuevo más tarde',
    }
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const issues = error.issues ?? error.errors ?? []
    const firstIssue = issues[0]
    const message = firstIssue?.message ?? 'Datos inválidos'
    return {
      category: 'validation',
      message,
      action: 'Revisa los campos marcados e inténtalo de nuevo',
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Auth errors
    if (
      message.includes('no autenticado') ||
      message.includes('not authenticated') ||
      message.includes('jwt') ||
      message.includes('session') ||
      message.includes('token') ||
      message.includes('unauthorized') ||
      message.includes('no autorizado')
    ) {
      return {
        category: 'auth',
        message: 'Tu sesión ha expirado',
        action: 'Inicia sesión de nuevo para continuar',
      }
    }

    // Database errors
    if (
      message.includes('database') ||
      message.includes('rpc') ||
      message.includes('company_id') ||
      message.includes('rls') ||
      message.includes('permission') ||
      message.includes('violates') ||
      message.includes('constraint') ||
      message.includes('duplicate') ||
      message.includes('foreign key') ||
      message.includes('period_closed') ||
      message.includes('transaction_not_found') ||
      message.includes('same_account') ||
      message.includes('missing_')
    ) {
      return {
        category: 'database',
        message: 'Error en la base de datos',
        action: 'Intenta de nuevo o contacta soporte si el problema persiste',
      }
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('must be') ||
      message.includes('cannot be') ||
      message.includes('debe ser') ||
      message.includes('requerido') ||
      message.includes('inválido')
    ) {
      return {
        category: 'validation',
        message: 'Los datos ingresados no son válidos',
        action: 'Revisa los campos e inténtalo de nuevo',
      }
    }

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('conexión') ||
      message.includes('conexion')
    ) {
      return {
        category: 'network',
        message: 'Error de conexión',
        action: 'Verifica tu conexión a internet e inténtalo de nuevo',
      }
    }

    // Return as unknown with the original message
    return {
      category: 'unknown',
      message: error.message || 'Error desconocido',
      action: 'Intenta de nuevo más tarde',
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    const lower = error.toLowerCase()

    if (
      lower.includes('no autenticado') ||
      lower.includes('not authenticated') ||
      lower.includes('jwt') ||
      lower.includes('session')
    ) {
      return {
        category: 'auth',
        message: 'Tu sesión ha expirado',
        action: 'Inicia sesión de nuevo para continuar',
      }
    }

    if (
      lower.includes('database') ||
      lower.includes('rpc') ||
      lower.includes('company_id') ||
      lower.includes('rls') ||
      lower.includes('permission')
    ) {
      return {
        category: 'database',
        message: 'Error en la base de datos',
        action: 'Intenta de nuevo o contacta soporte si el problema persiste',
      }
    }

    return {
      category: 'unknown',
      message: error,
      action: 'Intenta de nuevo más tarde',
    }
  }

  // Fallback for any other type
  return {
    category: 'unknown',
    message: 'Error desconocido',
    action: 'Intenta de nuevo más tarde',
  }
}