import { describe, it, expect, beforeEach } from 'bun:test'
import { testDb, createTestUser } from './setup'

describe('Settings API', () => {
  let testUser: ReturnType<typeof createTestUser>

  beforeEach(() => {
    testUser = createTestUser()
  })

  describe('Get Settings', () => {
    it('should return empty object for new user', () => {
      const settings = testDb
        .query<{ settings: string }, []>('SELECT settings FROM user_settings WHERE user_id = ?')
        .get(testUser.id)

      expect(settings).toBeNull()
    })

    it('should return saved settings', () => {
      const settingsData = { defaultDueDays: 5, theme: 'dark' }
      testDb.run('INSERT INTO user_settings (user_id, settings) VALUES (?, ?)', [
        testUser.id,
        JSON.stringify(settingsData),
      ])

      const settings = testDb
        .query<{ settings: string }, []>('SELECT settings FROM user_settings WHERE user_id = ?')
        .get(testUser.id)

      expect(JSON.parse(settings?.settings || '{}')).toEqual(settingsData)
    })
  })

  describe('Update Settings', () => {
    it('should create settings for new user', () => {
      const settingsData = { defaultDueDays: 3 }
      testDb.run('INSERT INTO user_settings (user_id, settings) VALUES (?, ?)', [
        testUser.id,
        JSON.stringify(settingsData),
      ])

      const settings = testDb
        .query<{ settings: string }, []>('SELECT settings FROM user_settings WHERE user_id = ?')
        .get(testUser.id)

      expect(settings).not.toBeNull()
      expect(JSON.parse(settings?.settings || '{}')).toEqual(settingsData)
    })

    it('should update existing settings', () => {
      testDb.run('INSERT INTO user_settings (user_id, settings) VALUES (?, ?)', [
        testUser.id,
        JSON.stringify({ defaultDueDays: 3 }),
      ])

      testDb.run('UPDATE user_settings SET settings = ? WHERE user_id = ?', [
        JSON.stringify({ defaultDueDays: 5, theme: 'light' }),
        testUser.id,
      ])

      const settings = testDb
        .query<{ settings: string }, []>('SELECT settings FROM user_settings WHERE user_id = ?')
        .get(testUser.id)

      const parsed = JSON.parse(settings?.settings || '{}')
      expect(parsed.defaultDueDays).toBe(5)
      expect(parsed.theme).toBe('light')
    })

    it('should handle nested settings', () => {
      const nestedSettings = {
        defaultDueDays: 3,
        dueDateWarnings: {
          urgent: 1,
          warning: 24,
          approaching: 72,
        },
        fullscreen: {
          autoRefreshInterval: 30,
          showClock: true,
        },
      }

      testDb.run('INSERT INTO user_settings (user_id, settings) VALUES (?, ?)', [
        testUser.id,
        JSON.stringify(nestedSettings),
      ])

      const settings = testDb
        .query<{ settings: string }, []>('SELECT settings FROM user_settings WHERE user_id = ?')
        .get(testUser.id)

      const parsed = JSON.parse(settings?.settings || '{}')
      expect(parsed.dueDateWarnings.urgent).toBe(1)
      expect(parsed.fullscreen.showClock).toBe(true)
    })
  })

  describe('Delete Settings', () => {
    it('should cascade delete when user is deleted', () => {
      testDb.run('INSERT INTO user_settings (user_id, settings) VALUES (?, ?)', [
        testUser.id,
        JSON.stringify({ test: true }),
      ])

      testDb.run('DELETE FROM users WHERE id = ?', [testUser.id])

      const settings = testDb
        .query<{ user_id: number }, []>('SELECT user_id FROM user_settings WHERE user_id = ?')
        .get(testUser.id)

      expect(settings).toBeNull()
    })
  })
})
