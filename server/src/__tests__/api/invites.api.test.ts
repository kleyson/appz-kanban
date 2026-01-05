import { describe, it, expect } from 'bun:test'
import { request, parseResponse, registerTestUser, setupApiTests } from './setup'

describe('Invites API Endpoints', () => {
  setupApiTests()
  describe('GET /api/invites', () => {
    it('should return empty array when no invites exist', async () => {
      const { token } = await registerTestUser('inviteadmin', 'password123', 'Invite Admin')

      const response = await request('/api/invites', { token })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ invites: unknown[] }>(response)
      expect(data.invites).toEqual([])
    })

    it('should require authentication', async () => {
      const response = await request('/api/invites')

      expect(response.status).toBe(401)
    })

    it('should return created invites', async () => {
      const { token } = await registerTestUser('invitelist', 'password123', 'Invite List')

      // Create an invite
      await request('/api/invites', {
        method: 'POST',
        token,
      })

      const response = await request('/api/invites', { token })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ invites: { code: string }[] }>(response)
      expect(data.invites.length).toBe(1)
      expect(data.invites[0].code).toBeDefined()
    })
  })

  describe('POST /api/invites', () => {
    it('should create an invite code', async () => {
      const { token } = await registerTestUser('invitecreator', 'password123', 'Invite Creator')

      const response = await request('/api/invites', {
        method: 'POST',
        token,
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{
        invite: { id: number; code: string; expiresAt: string }
      }>(response)
      expect(data.invite.code).toBeDefined()
      expect(data.invite.code.length).toBeGreaterThan(0)
      expect(data.invite.expiresAt).toBeDefined()
    })

    it('should create unique invite codes', async () => {
      const { token } = await registerTestUser('inviteunique', 'password123', 'Invite Unique')

      const res1 = await request('/api/invites', { method: 'POST', token })
      const data1 = await parseResponse<{ invite: { code: string } }>(res1)

      const res2 = await request('/api/invites', { method: 'POST', token })
      const data2 = await parseResponse<{ invite: { code: string } }>(res2)

      expect(data1.invite.code).not.toBe(data2.invite.code)
    })
  })

  describe('DELETE /api/invites/:id', () => {
    it('should revoke an invite', async () => {
      const { token } = await registerTestUser('invitedeleter', 'password123', 'Invite Deleter')

      // Create an invite
      const createRes = await request('/api/invites', {
        method: 'POST',
        token,
      })
      const createData = await parseResponse<{ invite: { id: number } }>(createRes)

      // Delete invite
      const response = await request(`/api/invites/${createData.invite.id}`, {
        method: 'DELETE',
        token,
      })

      expect(response.status).toBe(200)

      // Verify it's gone
      const listRes = await request('/api/invites', { token })
      const listData = await parseResponse<{ invites: unknown[] }>(listRes)
      expect(listData.invites.length).toBe(0)
    })
  })

  describe('Using Invite Codes', () => {
    it('should allow registration with valid invite code', async () => {
      // First user becomes admin
      const { token: adminToken } = await registerTestUser('admin', 'password123', 'Admin')

      // Create invite
      const inviteRes = await request('/api/invites', {
        method: 'POST',
        token: adminToken,
      })
      const inviteData = await parseResponse<{ invite: { code: string } }>(inviteRes)

      // Register new user with invite code
      const response = await request('/api/auth/register', {
        method: 'POST',
        body: {
          username: 'inviteduser',
          password: 'password123',
          displayName: 'Invited User',
          inviteCode: inviteData.invite.code,
        },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{
        token: string
        user: { username: string; role: string }
      }>(response)
      expect(data.user.username).toBe('inviteduser')
      expect(data.user.role).toBe('user') // Not admin
    })

    it('should reject registration with invalid invite code', async () => {
      // First user becomes admin
      await registerTestUser('admin2', 'password123', 'Admin')

      // Try to register with invalid code
      const response = await request('/api/auth/register', {
        method: 'POST',
        body: {
          username: 'invalidinvite',
          password: 'password123',
          displayName: 'Invalid Invite',
          inviteCode: 'invalid-code-123',
        },
      })

      expect(response.status).toBe(400)
      const data = await parseResponse<{ error: { code: string } }>(response)
      expect(data.error.code).toBe('INVALID_INVITE')
    })

    it('should not allow reuse of invite code', async () => {
      // First user becomes admin
      const { token: adminToken } = await registerTestUser('admin3', 'password123', 'Admin')

      // Create invite
      const inviteRes = await request('/api/invites', {
        method: 'POST',
        token: adminToken,
      })
      const inviteData = await parseResponse<{ invite: { code: string } }>(inviteRes)

      // First registration should succeed
      await request('/api/auth/register', {
        method: 'POST',
        body: {
          username: 'firstuse',
          password: 'password123',
          displayName: 'First Use',
          inviteCode: inviteData.invite.code,
        },
      })

      // Second registration with same code should fail
      const response = await request('/api/auth/register', {
        method: 'POST',
        body: {
          username: 'seconduse',
          password: 'password123',
          displayName: 'Second Use',
          inviteCode: inviteData.invite.code,
        },
      })

      expect(response.status).toBe(400)
      const data = await parseResponse<{ error: { code: string } }>(response)
      expect(data.error.code).toBe('INVITE_ALREADY_USED')
    })
  })
})
