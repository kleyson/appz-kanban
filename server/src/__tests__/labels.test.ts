import { describe, it, expect, beforeEach } from 'bun:test'
import { testDb, createTestUser, createTestBoard, createTestLabel } from './setup'

describe('Labels API', () => {
  let testUser: ReturnType<typeof createTestUser>
  let testBoard: ReturnType<typeof createTestBoard>

  beforeEach(() => {
    testUser = createTestUser()
    testBoard = createTestBoard(testUser.id)
  })

  describe('Create Label', () => {
    it('should create a new label', () => {
      const label = createTestLabel(testBoard.id, 'Bug', '#ff0000')

      expect(label.id).toBeGreaterThan(0)
      expect(label.name).toBe('Bug')
      expect(label.color).toBe('#ff0000')
    })

    it('should create multiple labels for a board', () => {
      createTestLabel(testBoard.id, 'Bug', '#ff0000')
      createTestLabel(testBoard.id, 'Feature', '#00ff00')
      createTestLabel(testBoard.id, 'Enhancement', '#0000ff')

      const labels = testDb
        .query<{ name: string }, []>('SELECT name FROM labels WHERE board_id = ?')
        .all(testBoard.id)

      expect(labels).toHaveLength(3)
    })
  })

  describe('Update Label', () => {
    it('should update label name', () => {
      const label = createTestLabel(testBoard.id, 'Old Name')

      testDb.run('UPDATE labels SET name = ? WHERE id = ?', ['New Name', label.id])

      const updated = testDb
        .query<{ name: string }, []>('SELECT name FROM labels WHERE id = ?')
        .get(label.id)

      expect(updated?.name).toBe('New Name')
    })

    it('should update label color', () => {
      const label = createTestLabel(testBoard.id, 'Label', '#ff0000')

      testDb.run('UPDATE labels SET color = ? WHERE id = ?', ['#00ff00', label.id])

      const updated = testDb
        .query<{ color: string }, []>('SELECT color FROM labels WHERE id = ?')
        .get(label.id)

      expect(updated?.color).toBe('#00ff00')
    })
  })

  describe('Delete Label', () => {
    it('should delete label', () => {
      const label = createTestLabel(testBoard.id)

      testDb.run('DELETE FROM labels WHERE id = ?', [label.id])

      const deleted = testDb
        .query<{ id: number }, []>('SELECT id FROM labels WHERE id = ?')
        .get(label.id)

      expect(deleted).toBeNull()
    })
  })

  describe('Get Labels', () => {
    it('should get all labels for a board', () => {
      createTestLabel(testBoard.id, 'Label 1', '#ff0000')
      createTestLabel(testBoard.id, 'Label 2', '#00ff00')

      const labels = testDb
        .query<
          { name: string; color: string },
          []
        >('SELECT name, color FROM labels WHERE board_id = ?')
        .all(testBoard.id)

      expect(labels).toHaveLength(2)
    })

    it('should not get labels from other boards', () => {
      const otherBoard = createTestBoard(testUser.id, 'Other Board')
      createTestLabel(otherBoard.id, 'Other Label')

      const labels = testDb
        .query<{ name: string }, []>('SELECT name FROM labels WHERE board_id = ?')
        .all(testBoard.id)

      expect(labels).toHaveLength(0)
    })
  })
})
