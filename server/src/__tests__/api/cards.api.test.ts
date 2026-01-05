import { describe, it, expect } from 'bun:test'
import { request, parseResponse, registerTestUser, setupApiTests } from './setup'

describe('Cards API Endpoints', () => {
  setupApiTests()
  async function createBoardWithColumn(token: string) {
    const boardRes = await request('/api/boards', {
      method: 'POST',
      token,
      body: { name: 'Card Test Board' },
    })
    const board = await parseResponse<{ id: number }>(boardRes)

    const colRes = await request(`/api/boards/${board.id}/columns`, {
      method: 'POST',
      token,
      body: { name: 'Test Column' },
    })
    const column = await parseResponse<{ id: number }>(colRes)

    return { board, column }
  }

  describe('POST /api/columns/:columnId/cards', () => {
    it('should create a card', async () => {
      const { token } = await registerTestUser('cardcreator', 'password123', 'Card Creator')
      const { column } = await createBoardWithColumn(token)

      const response = await request(`/api/columns/${column.id}/cards`, {
        method: 'POST',
        token,
        body: { title: 'My First Card' },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ id: number; title: string; position: number }>(response)
      expect(data.title).toBe('My First Card')
      expect(data.position).toBe(0)
    })

    it('should create card with optional fields', async () => {
      const { token } = await registerTestUser('cardoptional', 'password123', 'Card Optional')
      const { column } = await createBoardWithColumn(token)

      const response = await request(`/api/columns/${column.id}/cards`, {
        method: 'POST',
        token,
        body: {
          title: 'Full Card',
          description: 'A detailed description',
          priority: 'high',
          color: '#ff0000',
        },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{
        title: string
        description: string
        priority: string
        color: string
      }>(response)
      expect(data.description).toBe('A detailed description')
      expect(data.priority).toBe('high')
      expect(data.color).toBe('#ff0000')
    })
  })

  describe('PUT /api/cards/:id', () => {
    it('should update card title', async () => {
      const { token } = await registerTestUser('cardupdater', 'password123', 'Card Updater')
      const { column } = await createBoardWithColumn(token)

      // Create card
      const cardRes = await request(`/api/columns/${column.id}/cards`, {
        method: 'POST',
        token,
        body: { title: 'Original Title' },
      })
      const card = await parseResponse<{ id: number }>(cardRes)

      // Update card
      const response = await request(`/api/cards/${card.id}`, {
        method: 'PUT',
        token,
        body: { title: 'Updated Title' },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ title: string }>(response)
      expect(data.title).toBe('Updated Title')
    })

    it('should update card subtasks', async () => {
      const { token } = await registerTestUser('cardsubtasks', 'password123', 'Card Subtasks')
      const { column } = await createBoardWithColumn(token)

      // Create card
      const cardRes = await request(`/api/columns/${column.id}/cards`, {
        method: 'POST',
        token,
        body: { title: 'Task with Subtasks' },
      })
      const card = await parseResponse<{ id: number }>(cardRes)

      // Update with subtasks
      const subtasks = [
        { id: '1', title: 'Subtask 1', completed: false },
        { id: '2', title: 'Subtask 2', completed: true },
      ]

      const response = await request(`/api/cards/${card.id}`, {
        method: 'PUT',
        token,
        body: { subtasks },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ subtasks: typeof subtasks }>(response)
      expect(data.subtasks).toEqual(subtasks)
    })
  })

  describe('PUT /api/cards/:id/move', () => {
    it('should move card to another column', async () => {
      const { token } = await registerTestUser('cardmover', 'password123', 'Card Mover')

      // Create board with two columns
      const boardRes = await request('/api/boards', {
        method: 'POST',
        token,
        body: { name: 'Move Test Board' },
      })
      const board = await parseResponse<{ id: number }>(boardRes)

      const col1Res = await request(`/api/boards/${board.id}/columns`, {
        method: 'POST',
        token,
        body: { name: 'Source' },
      })
      const col1 = await parseResponse<{ id: number }>(col1Res)

      const col2Res = await request(`/api/boards/${board.id}/columns`, {
        method: 'POST',
        token,
        body: { name: 'Destination' },
      })
      const col2 = await parseResponse<{ id: number }>(col2Res)

      // Create card in first column
      const cardRes = await request(`/api/columns/${col1.id}/cards`, {
        method: 'POST',
        token,
        body: { title: 'Movable Card' },
      })
      const card = await parseResponse<{ id: number }>(cardRes)

      // Move card to second column
      const response = await request(`/api/cards/${card.id}/move`, {
        method: 'PUT',
        token,
        body: { columnId: col2.id, position: 0 },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ columnId: number }>(response)
      expect(data.columnId).toBe(col2.id)
    })
  })

  describe('DELETE /api/cards/:id', () => {
    it('should delete card', async () => {
      const { token } = await registerTestUser('carddeleter', 'password123', 'Card Deleter')
      const { column } = await createBoardWithColumn(token)

      // Create card
      const cardRes = await request(`/api/columns/${column.id}/cards`, {
        method: 'POST',
        token,
        body: { title: 'Card to Delete' },
      })
      const card = await parseResponse<{ id: number }>(cardRes)

      // Delete card
      const response = await request(`/api/cards/${card.id}`, {
        method: 'DELETE',
        token,
      })

      expect(response.status).toBe(204) // No Content on successful delete
    })
  })
})
