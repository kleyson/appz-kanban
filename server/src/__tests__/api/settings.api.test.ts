import { describe, it, expect } from 'bun:test'
import { request, parseResponse, registerTestUser, setupApiTests } from './setup'

describe('Settings API Endpoints', () => {
  setupApiTests()
  describe('GET /api/settings', () => {
    it('should return default settings for new user', async () => {
      const { token } = await registerTestUser('settingsget', 'password123', 'Settings Get')

      const response = await request('/api/settings', { token })

      expect(response.status).toBe(200)
      const data = await parseResponse<Record<string, unknown>>(response)
      // Settings are returned directly, not wrapped
      expect(data).toBeDefined()
    })

    it('should require authentication', async () => {
      const response = await request('/api/settings')

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/settings', () => {
    it('should update settings', async () => {
      const { token } = await registerTestUser('settingsupdate', 'password123', 'Settings Update')

      // Use the actual settings schema structure
      const response = await request('/api/settings', {
        method: 'PUT',
        token,
        body: {
          defaultColumns: ['To Do', 'In Progress', 'Done'],
        },
      })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ defaultColumns: string[] }>(response)
      expect(data.defaultColumns).toEqual(['To Do', 'In Progress', 'Done'])
    })

    it('should persist settings across requests', async () => {
      const { token } = await registerTestUser('settingspersist', 'password123', 'Settings Persist')

      // Update settings with valid schema field
      await request('/api/settings', {
        method: 'PUT',
        token,
        body: { defaultDueDays: 7 },
      })

      // Get settings again
      const response = await request('/api/settings', { token })

      expect(response.status).toBe(200)
      const data = await parseResponse<{ defaultDueDays?: number }>(response)
      expect(data.defaultDueDays).toBe(7)
    })
  })

  describe('DELETE /api/settings', () => {
    it('should reset settings to defaults', async () => {
      const { token } = await registerTestUser('settingsreset', 'password123', 'Settings Reset')

      // First update settings
      await request('/api/settings', {
        method: 'PUT',
        token,
        body: { defaultDueDays: 14 },
      })

      // Reset settings - returns 204 No Content
      const response = await request('/api/settings', {
        method: 'DELETE',
        token,
      })

      expect(response.status).toBe(204)

      // Verify reset - get default settings again
      const getResponse = await request('/api/settings', { token })
      const data = await parseResponse<{ defaultDueDays?: number }>(getResponse)
      // After reset, should return default value (3 days)
      expect(data.defaultDueDays).toBe(3)
    })
  })
})
