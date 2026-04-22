import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../auth-store'

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      userId: null,
      companyId: null,
      role: null,
      fullName: null,
      email: null,
      isAuthenticated: false,
    })
  })

  describe('initial state', () => {
    it('should have null user data', () => {
      const state = useAuthStore.getState()
      expect(state.userId).toBeNull()
      expect(state.email).toBeNull()
      expect(state.companyId).toBeNull()
      expect(state.role).toBeNull()
      expect(state.fullName).toBeNull()
    })

    it('should not be authenticated initially', () => {
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('setUser', () => {
    it('should set user data', () => {
      const { setUser } = useAuthStore.getState()
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        companyId: 'company-456',
        role: 'admin',
        fullName: 'Test User',
      }
      
      setUser(user)
      
      const state = useAuthStore.getState()
      expect(state.userId).toBe('user-123')
      expect(state.email).toBe('test@example.com')
      expect(state.companyId).toBe('company-456')
      expect(state.role).toBe('admin')
      expect(state.fullName).toBe('Test User')
      expect(state.isAuthenticated).toBe(true)
    })

    it('should handle null user', () => {
      const { setUser } = useAuthStore.getState()
      setUser(null)
      
      const state = useAuthStore.getState()
      expect(state.userId).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('clearUser', () => {
    it('should clear all user data', () => {
      const { setUser, clearUser } = useAuthStore.getState()
      setUser({
        id: 'user-123',
        email: 'test@example.com',
        companyId: 'company-456',
        role: 'admin',
        fullName: 'Test User',
      })
      
      clearUser()
      
      const state = useAuthStore.getState()
      expect(state.userId).toBeNull()
      expect(state.email).toBeNull()
      expect(state.companyId).toBeNull()
      expect(state.role).toBeNull()
      expect(state.fullName).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })
})
