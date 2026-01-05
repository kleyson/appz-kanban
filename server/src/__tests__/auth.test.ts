import { describe, it, expect, beforeEach } from 'bun:test'
import { testDb, createTestUser, setupTests } from './setup'

describe('Auth API', () => {
  setupTests()

  describe('User Registration', () => {
    it('should create a new user', () => {
      const user = createTestUser('newuser', 'New User')

      expect(user.id).toBeGreaterThan(0)
      expect(user.username).toBe('newuser')
      expect(user.display_name).toBe('New User')
    })

    it('should not allow duplicate usernames', () => {
      createTestUser('duplicate', 'User 1')

      expect(() => createTestUser('duplicate', 'User 2')).toThrow()
    })

    it('should hash password', () => {
      createTestUser('hashtest', 'Hash Test')

      const result = testDb
        .query<{ password_hash: string }, []>('SELECT password_hash FROM users WHERE username = ?')
        .get('hashtest')

      expect(result?.password_hash).not.toBe('password123')
      expect(result?.password_hash).toContain('$')
    })
  })

  describe('User Authentication', () => {
    beforeEach(() => {
      createTestUser('authuser', 'Auth User')
    })

    it('should verify correct password', () => {
      const result = testDb
        .query<{ password_hash: string }, []>('SELECT password_hash FROM users WHERE username = ?')
        .get('authuser')

      const isValid = Bun.password.verifySync('password123', result!.password_hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', () => {
      const result = testDb
        .query<{ password_hash: string }, []>('SELECT password_hash FROM users WHERE username = ?')
        .get('authuser')

      const isValid = Bun.password.verifySync('wrongpassword', result!.password_hash)
      expect(isValid).toBe(false)
    })
  })
})
