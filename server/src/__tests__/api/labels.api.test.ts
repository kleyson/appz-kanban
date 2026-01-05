import { describe, it, expect } from 'bun:test'
import { request, parseResponse, registerTestUser, setupApiTests } from './setup'

describe('Labels API Endpoints', () => {
  setupApiTests()
  async function createBoard(token: string) {
    const response = await request('/api/boards', {
      method: 'POST',
      token,
      body: { name: 'Label Test Board' },
    })
    return parseResponse<{ id: number }>(response)
  }

  describe('GET /api/boards/:id/labels', () => {
    it('should return empty array when no labels exist', async () => {
      const { token } = await registerTestUser('labelget', 'password123', 'Label Get')
      const board = await createBoard(token)

      const response = await request(`/api/boards/${board.id}/labels`, { token })

      expect(response.status).toBe(200)
      const data = await parseResponse<unknown[]>(response)
      expect(data).toEqual([])
    })

    it('should return board labels', async () => {
      const { token } = await registerTestUser('labellist', 'password123', 'Label List')
      const board = await createBoard(token)

      // Create label
      await request(`/api/boards/${board.id}/labels`, {
        method: 'POST',
        token,
        body: { name: 'Bug', color: '#ff0000' },
      })

      const response = await request(`/api/boards/${board.id}/labels`, { token })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ name: string; color: string }[]>(response)
      expect(data.length).toBe(1)
      expect(data[0].name).toBe('Bug')
      expect(data[0].color).toBe('#ff0000')
    })
  })

  describe('POST /api/boards/:id/labels', () => {
    it('should create a label', async () => {
      const { token } = await registerTestUser('labelcreator', 'password123', 'Label Creator')
      const board = await createBoard(token)

      const response = await request(`/api/boards/${board.id}/labels`, {
        method: 'POST',
        token,
        body: { name: 'Feature', color: '#00ff00' },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ id: number; name: string; color: string }>(response)
      expect(data.name).toBe('Feature')
      expect(data.color).toBe('#00ff00')
      expect(data.id).toBeGreaterThan(0)
    })
  })

  describe('PUT /api/labels/:id', () => {
    it('should update label', async () => {
      const { token } = await registerTestUser('labelupdater', 'password123', 'Label Updater')
      const board = await createBoard(token)

      // Create label
      const createRes = await request(`/api/boards/${board.id}/labels`, {
        method: 'POST',
        token,
        body: { name: 'Original', color: '#000000' },
      })
      const label = await parseResponse<{ id: number }>(createRes)

      // Update label
      const response = await request(`/api/labels/${label.id}`, {
        method: 'PUT',
        token,
        body: { name: 'Updated', color: '#ffffff' },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ name: string; color: string }>(response)
      expect(data.name).toBe('Updated')
      expect(data.color).toBe('#ffffff')
    })
  })

  describe('DELETE /api/labels/:id', () => {
    it('should delete label', async () => {
      const { token } = await registerTestUser('labeldeleter', 'password123', 'Label Deleter')
      const board = await createBoard(token)

      // Create label
      const createRes = await request(`/api/boards/${board.id}/labels`, {
        method: 'POST',
        token,
        body: { name: 'To Delete', color: '#123456' },
      })
      const label = await parseResponse<{ id: number }>(createRes)

      // Delete label
      const response = await request(`/api/labels/${label.id}`, {
        method: 'DELETE',
        token,
      })

      expect(response.status).toBe(204)

      // Verify deletion
      const listRes = await request(`/api/boards/${board.id}/labels`, { token })
      const labels = await parseResponse<unknown[]>(listRes)
      expect(labels.length).toBe(0)
    })
  })
})
