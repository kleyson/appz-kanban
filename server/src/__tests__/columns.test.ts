import { describe, it, expect, beforeEach } from 'bun:test'
import { testDb, createTestUser, createTestBoard, createTestColumn, setupTests } from './setup'

describe('Columns API', () => {
  setupTests()

  let testUser: ReturnType<typeof createTestUser>
  let testBoard: ReturnType<typeof createTestBoard>

  beforeEach(() => {
    testUser = createTestUser()
    testBoard = createTestBoard(testUser.id)
  })

  describe('Create Column', () => {
    it('should create a new column', () => {
      const column = createTestColumn(testBoard.id, 'New Column', 0)

      expect(column.id).toBeGreaterThan(0)
      expect(column.name).toBe('New Column')
      expect(column.position).toBe(0)
    })

    it('should create multiple columns with different positions', () => {
      createTestColumn(testBoard.id, 'First', 0)
      createTestColumn(testBoard.id, 'Second', 1)
      createTestColumn(testBoard.id, 'Third', 2)

      const columns = testDb
        .query<
          { name: string; position: number },
          []
        >('SELECT name, position FROM columns WHERE board_id = ? ORDER BY position')
        .all(testBoard.id)

      expect(columns).toHaveLength(3)
      expect(columns[0].name).toBe('First')
      expect(columns[2].name).toBe('Third')
    })
  })

  describe('Update Column', () => {
    it('should update column name', () => {
      const column = createTestColumn(testBoard.id, 'Old Name')

      testDb.run('UPDATE columns SET name = ? WHERE id = ?', ['New Name', column.id])

      const updated = testDb
        .query<{ name: string }, []>('SELECT name FROM columns WHERE id = ?')
        .get(column.id)

      expect(updated?.name).toBe('New Name')
    })

    it('should update column position', () => {
      const column = createTestColumn(testBoard.id, 'Column', 0)

      testDb.run('UPDATE columns SET position = ? WHERE id = ?', [5, column.id])

      const updated = testDb
        .query<{ position: number }, []>('SELECT position FROM columns WHERE id = ?')
        .get(column.id)

      expect(updated?.position).toBe(5)
    })
  })

  describe('Delete Column', () => {
    it('should delete column', () => {
      const column = createTestColumn(testBoard.id)

      testDb.run('DELETE FROM columns WHERE id = ?', [column.id])

      const deleted = testDb
        .query<{ id: number }, []>('SELECT id FROM columns WHERE id = ?')
        .get(column.id)

      expect(deleted).toBeNull()
    })
  })

  describe('Reorder Columns', () => {
    it('should reorder columns', () => {
      const col1 = createTestColumn(testBoard.id, 'First', 0)
      const col2 = createTestColumn(testBoard.id, 'Second', 1)
      const col3 = createTestColumn(testBoard.id, 'Third', 2)

      // Move first to last position
      testDb.run('UPDATE columns SET position = ? WHERE id = ?', [2, col1.id])
      testDb.run('UPDATE columns SET position = ? WHERE id = ?', [0, col2.id])
      testDb.run('UPDATE columns SET position = ? WHERE id = ?', [1, col3.id])

      const columns = testDb
        .query<
          { name: string; position: number },
          []
        >('SELECT name, position FROM columns WHERE board_id = ? ORDER BY position')
        .all(testBoard.id)

      expect(columns[0].name).toBe('Second')
      expect(columns[1].name).toBe('Third')
      expect(columns[2].name).toBe('First')
    })
  })
})
