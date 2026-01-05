import { describe, it, expect } from 'bun:test'
import { request, parseResponse, registerTestUser, setupApiTests } from './setup'

describe('Boards API Endpoints', () => {
  setupApiTests()
  describe('GET /api/boards', () => {
    it('should return empty array when user has no boards', async () => {
      const { token } = await registerTestUser('boarduser', 'password123', 'Board User')

      const response = await request('/api/boards', { token })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ id: number; name: string }[]>(response)
      expect(data).toEqual([])
    })

    it('should require authentication', async () => {
      const response = await request('/api/boards')

      expect(response.status).toBe(401)
    })

    it('should return boards the user is member of', async () => {
      const { token } = await registerTestUser('boardowner', 'password123', 'Board Owner')

      // Create a board first
      await request('/api/boards', {
        method: 'POST',
        token,
        body: { name: 'Test Board' },
      })

      const response = await request('/api/boards', { token })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ id: number; name: string }[]>(response)
      expect(data.length).toBe(1)
      expect(data[0].name).toBe('Test Board')
    })
  })

  describe('POST /api/boards', () => {
    it('should create a new board', async () => {
      const { token, user } = await registerTestUser('creator', 'password123', 'Creator')

      const response = await request('/api/boards', {
        method: 'POST',
        token,
        body: { name: 'My New Board' },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ id: number; name: string; ownerId: number }>(response)
      expect(data.name).toBe('My New Board')
      expect(data.ownerId).toBe(user.id)
      expect(data.id).toBeGreaterThan(0)
    })

    it('should require authentication', async () => {
      const response = await request('/api/boards', {
        method: 'POST',
        body: { name: 'Unauthorized Board' },
      })

      expect(response.status).toBe(401)
    })

    it('should reject empty board name', async () => {
      const { token } = await registerTestUser('emptyname', 'password123', 'Empty Name')

      const response = await request('/api/boards', {
        method: 'POST',
        token,
        body: { name: '' },
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/boards/:id', () => {
    it('should return board details with columns', async () => {
      const { token } = await registerTestUser('boarddetails', 'password123', 'Board Details')

      // Create board
      const createResponse = await request('/api/boards', {
        method: 'POST',
        token,
        body: { name: 'Details Board' },
      })
      const board = await parseResponse<{ id: number }>(createResponse)

      // Get board details
      const response = await request(`/api/boards/${board.id}`, { token })

      expect(response.status).toBe(200)
      const data = await parseResponse<{
        id: number
        name: string
        columns: unknown[]
        members: unknown[]
      }>(response)
      expect(data.id).toBe(board.id)
      expect(data.name).toBe('Details Board')
      expect(Array.isArray(data.columns)).toBe(true)
      expect(Array.isArray(data.members)).toBe(true)
    })

    it('should return 404 for non-existent board', async () => {
      const { token } = await registerTestUser('notfound', 'password123', 'Not Found')

      const response = await request('/api/boards/99999', { token })

      expect(response.status).toBe(404)
    })

    it('should return 404 for board user is not member of', async () => {
      const { token: ownerToken } = await registerTestUser('owner1', 'password123', 'Owner')

      // Create board as owner
      const createResponse = await request('/api/boards', {
        method: 'POST',
        token: ownerToken,
        body: { name: 'Private Board' },
      })
      const board = await parseResponse<{ id: number }>(createResponse)

      // Create second user and try to access board
      const { token: otherToken } = await registerTestUser(
        'otheruser',
        'password123',
        'Other User',
        await createInviteCode(ownerToken)
      )

      const response = await request(`/api/boards/${board.id}`, { token: otherToken })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/boards/:id', () => {
    it('should update board name', async () => {
      const { token } = await registerTestUser('updater', 'password123', 'Updater')

      // Create board
      const createResponse = await request('/api/boards', {
        method: 'POST',
        token,
        body: { name: 'Original Name' },
      })
      const board = await parseResponse<{ id: number }>(createResponse)

      // Update board
      const response = await request(`/api/boards/${board.id}`, {
        method: 'PUT',
        token,
        body: { name: 'Updated Name' },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ id: number; name: string }>(response)
      expect(data.name).toBe('Updated Name')
    })

    it('should require ownership to update', async () => {
      const { token: ownerToken } = await registerTestUser('owner2', 'password123', 'Owner')

      // Create board as owner
      const createResponse = await request('/api/boards', {
        method: 'POST',
        token: ownerToken,
        body: { name: 'Owned Board' },
      })
      const board = await parseResponse<{ id: number }>(createResponse)

      // Create invite and add member
      const inviteCode = await createInviteCode(ownerToken)
      const { token: memberToken } = await registerTestUser(
        'member1',
        'password123',
        'Member',
        inviteCode
      )

      // Add member to board
      await request(`/api/boards/${board.id}/members`, {
        method: 'POST',
        token: ownerToken,
        body: { username: 'member1' },
      })

      // Try to update as member (should fail)
      const response = await request(`/api/boards/${board.id}`, {
        method: 'PUT',
        token: memberToken,
        body: { name: 'Hacked Name' },
      })

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/boards/:id', () => {
    it('should delete board', async () => {
      const { token } = await registerTestUser('deleter', 'password123', 'Deleter')

      // Create board
      const createResponse = await request('/api/boards', {
        method: 'POST',
        token,
        body: { name: 'Board to Delete' },
      })
      const board = await parseResponse<{ id: number }>(createResponse)

      // Delete board
      const response = await request(`/api/boards/${board.id}`, {
        method: 'DELETE',
        token,
      })

      expect(response.status).toBe(204)

      // Verify deletion
      const getResponse = await request(`/api/boards/${board.id}`, { token })
      expect(getResponse.status).toBe(404)
    })

    it('should require ownership to delete', async () => {
      const { token: ownerToken } = await registerTestUser('owner3', 'password123', 'Owner')

      // Create board
      const createResponse = await request('/api/boards', {
        method: 'POST',
        token: ownerToken,
        body: { name: 'Protected Board' },
      })
      const board = await parseResponse<{ id: number }>(createResponse)

      // Create another user
      const inviteCode = await createInviteCode(ownerToken)
      const { token: otherToken } = await registerTestUser(
        'nonowner',
        'password123',
        'Non Owner',
        inviteCode
      )

      // Try to delete as non-owner
      const response = await request(`/api/boards/${board.id}`, {
        method: 'DELETE',
        token: otherToken,
      })

      // Should be 404 (user not member) or 403 (forbidden)
      expect([403, 404]).toContain(response.status)
    })
  })

  describe('Board Members', () => {
    it('should add member to board', async () => {
      const { token: ownerToken } = await registerTestUser('owner4', 'password123', 'Owner')

      // Create board
      const createResponse = await request('/api/boards', {
        method: 'POST',
        token: ownerToken,
        body: { name: 'Team Board' },
      })
      const board = await parseResponse<{ id: number }>(createResponse)

      // Create another user
      const inviteCode = await createInviteCode(ownerToken)
      await registerTestUser('newmember', 'password123', 'New Member', inviteCode)

      // Add member
      const response = await request(`/api/boards/${board.id}/members`, {
        method: 'POST',
        token: ownerToken,
        body: { username: 'newmember' },
      })

      expect(response.status).toBe(200)

      // Verify member can access board
      const { token: memberToken } = await request('/api/auth/login', {
        method: 'POST',
        body: { username: 'newmember', password: 'password123' },
      }).then((r) => parseResponse<{ token: string }>(r))

      const boardResponse = await request(`/api/boards/${board.id}`, { token: memberToken })
      expect(boardResponse.status).toBe(200)
    })

    it('should remove member from board', async () => {
      const { token: ownerToken } = await registerTestUser('owner5', 'password123', 'Owner')

      // Create board
      const createResponse = await request('/api/boards', {
        method: 'POST',
        token: ownerToken,
        body: { name: 'Remove Test Board' },
      })
      const board = await parseResponse<{ id: number }>(createResponse)

      // Create and add member
      const inviteCode = await createInviteCode(ownerToken)
      const { user: member } = await registerTestUser(
        'removablemember',
        'password123',
        'Removable',
        inviteCode
      )

      await request(`/api/boards/${board.id}/members`, {
        method: 'POST',
        token: ownerToken,
        body: { username: 'removablemember' },
      })

      // Remove member
      const response = await request(`/api/boards/${board.id}/members/${member.id}`, {
        method: 'DELETE',
        token: ownerToken,
      })

      expect(response.status).toBe(204)
    })
  })
})

/**
 * Helper to create an invite code (requires admin user)
 */
async function createInviteCode(adminToken: string): Promise<string> {
  const response = await request('/api/invites', {
    method: 'POST',
    token: adminToken,
  })

  if (response.status !== 200) {
    throw new Error('Failed to create invite code')
  }

  const data = await parseResponse<{ invite: { code: string } }>(response)
  return data.invite.code
}
