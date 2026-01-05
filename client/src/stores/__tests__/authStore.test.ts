import { describe, it, expect, beforeEach } from 'bun:test'
import { useAuthStore } from '../authStore'

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({ token: null, user: null })
  })

  it('should initialize with null token and user', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
  })

  it('should set auth with token and user', () => {
    const { setAuth } = useAuthStore.getState()
    const mockUser = {
      id: 1,
      username: 'testuser',
      displayName: 'Test User',
      role: 'user' as const,
    }

    setAuth('test-token', mockUser)

    const state = useAuthStore.getState()
    expect(state.token).toBe('test-token')
    expect(state.user).toEqual(mockUser)
  })

  it('should logout and clear token and user', () => {
    const { setAuth, logout } = useAuthStore.getState()
    const mockUser = {
      id: 1,
      username: 'testuser',
      displayName: 'Test User',
      role: 'user' as const,
    }

    setAuth('test-token', mockUser)
    logout()

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
  })
})
