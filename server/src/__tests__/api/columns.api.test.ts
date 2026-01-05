import { describe, it, expect } from 'bun:test'
import { request, parseResponse, registerTestUser, setupApiTests } from './setup'

describe('Columns API Endpoints', () => {
  setupApiTests()
  describe('POST /api/boards/:id/columns', () => {
    it('should create a column in a board', async () => {
      const { token } = await registerTestUser('colcreator', 'password123', 'Col Creator')

      // Create board
      const boardRes = await request('/api/boards', {
        method: 'POST',
        token,
        body: { name: 'Board with Columns' },
      })
      const board = await parseResponse<{ id: number }>(boardRes)

      // Create column
      const response = await request(`/api/boards/${board.id}/columns`, {
        method: 'POST',
        token,
        body: { name: 'To Do' },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ id: number; name: string; position: number }>(response)
      expect(data.name).toBe('To Do')
      // First column in a new board should have position 0
      expect(typeof data.position).toBe('number')
      expect(data.position).toBeGreaterThanOrEqual(0)
    })

    it('should increment position for subsequent columns', async () => {
      const { token } = await registerTestUser('colpos', 'password123', 'Col Position')

      // Create board
      const boardRes = await request('/api/boards', {
        method: 'POST',
        token,
        body: { name: 'Multi Column Board' },
      })
      const board = await parseResponse<{ id: number }>(boardRes)

      // Create first column
      const firstRes = await request(`/api/boards/${board.id}/columns`, {
        method: 'POST',
        token,
        body: { name: 'First' },
      })
      const firstCol = await parseResponse<{ position: number }>(firstRes)

      // Create second column
      const response = await request(`/api/boards/${board.id}/columns`, {
        method: 'POST',
        token,
        body: { name: 'Second' },
      })

      const data = await parseResponse<{ position: number }>(response)
      // Second column should have position one greater than first
      expect(data.position).toBe(firstCol.position + 1)
    })
  })

  describe('PUT /api/columns/:id', () => {
    it('should update column name', async () => {
      const { token } = await registerTestUser('colupdater', 'password123', 'Col Updater')

      // Create board and column
      const boardRes = await request('/api/boards', {
        method: 'POST',
        token,
        body: { name: 'Update Test Board' },
      })
      const board = await parseResponse<{ id: number }>(boardRes)

      const colRes = await request(`/api/boards/${board.id}/columns`, {
        method: 'POST',
        token,
        body: { name: 'Original Name' },
      })
      const column = await parseResponse<{ id: number }>(colRes)

      // Update column
      const response = await request(`/api/columns/${column.id}`, {
        method: 'PUT',
        token,
        body: { name: 'Updated Name' },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ name: string }>(response)
      expect(data.name).toBe('Updated Name')
    })
  })

  describe('DELETE /api/columns/:id', () => {
    it('should delete column', async () => {
      const { token } = await registerTestUser('coldeleter', 'password123', 'Col Deleter')

      // Create board and column
      const boardRes = await request('/api/boards', {
        method: 'POST',
        token,
        body: { name: 'Delete Test Board' },
      })
      const board = await parseResponse<{ id: number }>(boardRes)

      const colRes = await request(`/api/boards/${board.id}/columns`, {
        method: 'POST',
        token,
        body: { name: 'Column to Delete' },
      })
      const column = await parseResponse<{ id: number }>(colRes)

      // Delete column
      const response = await request(`/api/columns/${column.id}`, {
        method: 'DELETE',
        token,
      })

      expect(response.status).toBe(204)
    })
  })

  describe('PUT /api/boards/:id/columns/reorder', () => {
    it('should reorder columns', async () => {
      const { token } = await registerTestUser('colreorder', 'password123', 'Col Reorder')

      // Create board
      const boardRes = await request('/api/boards', {
        method: 'POST',
        token,
        body: { name: 'Reorder Test Board' },
      })
      const board = await parseResponse<{ id: number }>(boardRes)

      // Create columns
      const col1Res = await request(`/api/boards/${board.id}/columns`, {
        method: 'POST',
        token,
        body: { name: 'First' },
      })
      const col1 = await parseResponse<{ id: number }>(col1Res)

      const col2Res = await request(`/api/boards/${board.id}/columns`, {
        method: 'POST',
        token,
        body: { name: 'Second' },
      })
      const col2 = await parseResponse<{ id: number }>(col2Res)

      // Reorder: swap positions
      const response = await request(`/api/boards/${board.id}/columns/reorder`, {
        method: 'PUT',
        token,
        body: { columnIds: [col2.id, col1.id] },
      })

      expect(response.status).toBe(200)
    })
  })
})
