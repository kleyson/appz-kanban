import { describe, it, expect } from 'bun:test'
import { request, parseResponse, registerTestUser, setupApiTests } from './setup'

describe('Auth API Endpoints', () => {
  setupApiTests()
  describe('GET /api/auth/setup-status', () => {
    it('should return isSetupComplete: false when no users exist', async () => {
      const response = await request('/api/auth/setup-status')

      expect(response.status).toBe(200)
      const data = await parseResponse<{ isSetupComplete: boolean }>(response)
      expect(data.isSetupComplete).toBe(false)
    })

    it('should return isSetupComplete: true after first user is registered', async () => {
      // Register first user
      await registerTestUser('admin', 'password123', 'Admin User')

      const response = await request('/api/auth/setup-status')

      expect(response.status).toBe(200)
      const data = await parseResponse<{ isSetupComplete: boolean }>(response)
      expect(data.isSetupComplete).toBe(true)
    })
  })

  describe('POST /api/auth/register', () => {
    it('should register the first user as admin', async () => {
      const response = await request('/api/auth/register', {
        method: 'POST',
        body: {
          username: 'firstuser',
          password: 'password123',
          displayName: 'First User',
        },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{
        token: string
        user: { id: number; username: string; displayName: string; role: string }
      }>(response)

      expect(data.token).toBeDefined()
      expect(data.token.length).toBeGreaterThan(0)
      expect(data.user.username).toBe('firstuser')
      expect(data.user.displayName).toBe('First User')
      expect(data.user.role).toBe('admin')
    })

    it('should reject registration without invite code after first user', async () => {
      // Register first user
      await registerTestUser('admin', 'password123', 'Admin')

      // Try to register second user without invite code
      const response = await request('/api/auth/register', {
        method: 'POST',
        body: {
          username: 'seconduser',
          password: 'password123',
          displayName: 'Second User',
        },
      })

      expect(response.status).toBe(400)
      const data = await parseResponse<{ error: { code: string; message: string } }>(response)
      expect(data.error.code).toBe('REGISTRATION_DISABLED')
    })

    it('should reject duplicate username', async () => {
      // Register first user
      await registerTestUser('existing', 'password123', 'Existing User')

      // Try to register with same username
      const response = await request('/api/auth/register', {
        method: 'POST',
        body: {
          username: 'existing',
          password: 'password123',
          displayName: 'Another User',
        },
      })

      expect(response.status).toBe(400)
      const data = await parseResponse<{ error: { code: string; message: string } }>(response)
      expect(data.error.code).toBe('USERNAME_TAKEN')
    })

    it('should reject short username', async () => {
      const response = await request('/api/auth/register', {
        method: 'POST',
        body: {
          username: 'ab', // less than 3 characters
          password: 'password123',
          displayName: 'Test User',
        },
      })

      // Elysia validation errors are converted to 400 by error handler
      expect(response.status).toBe(400)
    })

    it('should reject short password', async () => {
      const response = await request('/api/auth/register', {
        method: 'POST',
        body: {
          username: 'testuser',
          password: '12345', // less than 6 characters
          displayName: 'Test User',
        },
      })

      // Elysia validation errors are converted to 400 by error handler
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Register a user first
      await registerTestUser('logintest', 'mypassword', 'Login Test')

      // Login
      const response = await request('/api/auth/login', {
        method: 'POST',
        body: {
          username: 'logintest',
          password: 'mypassword',
        },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{
        token: string
        user: { id: number; username: string; displayName: string }
      }>(response)

      expect(data.token).toBeDefined()
      expect(data.token.length).toBeGreaterThan(0)
      expect(data.user.username).toBe('logintest')
    })

    it('should reject invalid password', async () => {
      // Register a user first
      await registerTestUser('wrongpass', 'correctpassword', 'Wrong Pass Test')

      // Try to login with wrong password
      const response = await request('/api/auth/login', {
        method: 'POST',
        body: {
          username: 'wrongpass',
          password: 'wrongpassword',
        },
      })

      expect(response.status).toBe(401)
      const data = await parseResponse<{ error: { code: string; message: string } }>(response)
      expect(data.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('should reject non-existent user', async () => {
      const response = await request('/api/auth/login', {
        method: 'POST',
        body: {
          username: 'nonexistent',
          password: 'somepassword',
        },
      })

      expect(response.status).toBe(401)
      const data = await parseResponse<{ error: { code: string; message: string } }>(response)
      expect(data.error.code).toBe('INVALID_CREDENTIALS')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      // Register and get token
      const { token, user: registeredUser } = await registerTestUser(
        'metest',
        'password123',
        'Me Test'
      )

      // Get current user
      const response = await request('/api/auth/me', { token })

      expect(response.status).toBe(200)
      const data = await parseResponse<{
        id: number
        username: string
        displayName: string
        role: string
      }>(response)

      expect(data.id).toBe(registeredUser.id)
      expect(data.username).toBe('metest')
      expect(data.displayName).toBe('Me Test')
    })

    it('should reject request without token', async () => {
      const response = await request('/api/auth/me')

      expect(response.status).toBe(401)
    })

    it('should reject request with invalid token', async () => {
      const response = await request('/api/auth/me', {
        token: 'invalid.token.here',
      })

      expect(response.status).toBe(401)
    })
  })
})
