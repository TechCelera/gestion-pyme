import { vi } from 'vitest'
import type { AuthenticatedContext } from '@/lib/auth/server-context'

const authMocks = vi.hoisted(() => ({
  requireAuthenticatedContext: vi.fn(),
  getAuthenticatedContext: vi.fn(),
  requireAdminContext: vi.fn(),
}))

vi.mock('@/lib/auth/server-context', () => ({
  requireAuthenticatedContext: authMocks.requireAuthenticatedContext,
  getAuthenticatedContext: authMocks.getAuthenticatedContext,
  requireAdminContext: authMocks.requireAdminContext,
}))

export const requireAuthenticatedContext = authMocks.requireAuthenticatedContext
export const getAuthenticatedContext = authMocks.getAuthenticatedContext
export const requireAdminContext = authMocks.requireAdminContext

export function stubAuthenticatedContext(ctx: AuthenticatedContext): void {
  authMocks.requireAuthenticatedContext.mockResolvedValue(ctx)
  authMocks.getAuthenticatedContext.mockResolvedValue(ctx)
}

export function stubAuthError(error: string): void {
  authMocks.requireAuthenticatedContext.mockResolvedValue({ error })
  authMocks.getAuthenticatedContext.mockResolvedValue(null)
}
