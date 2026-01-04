import { describe, it, expect, beforeEach } from 'bun:test'
import { testDb, createTestUser, createTestBoard, createTestColumn } from './setup'

describe('Boards API', () => {
  let testUser: ReturnType<typeof createTestUser>

  beforeEach(() => {
    testUser = createTestUser()
  })

  describe('Create Board', () => {
    it('should create a new board', () => {
      const board = createTestBoard(testUser.id, 'My Board')

      expect(board.id).toBeGreaterThan(0)
      expect(board.name).toBe('My Board')
      expect(board.owner_id).toBe(testUser.id)
    })

    it('should add owner as board member', () => {
      const board = createTestBoard(testUser.id)

      const member = testDb
        .query<
          { role: string },
          []
        >('SELECT role FROM board_members WHERE board_id = ? AND user_id = ?')
        .get(board.id, testUser.id)

      expect(member?.role).toBe('owner')
    })
  })

  describe('Get Boards', () => {
    it('should list user boards', () => {
      createTestBoard(testUser.id, 'Board 1')
      createTestBoard(testUser.id, 'Board 2')

      const boards = testDb
        .query<{ name: string }, []>(
          `SELECT b.name FROM boards b
           JOIN board_members bm ON b.id = bm.board_id
           WHERE bm.user_id = ?`
        )
        .all(testUser.id)

      expect(boards).toHaveLength(2)
    })

    it('should not list other users boards', () => {
      const otherUser = createTestUser('other', 'Other User')
      createTestBoard(otherUser.id, 'Other Board')

      const boards = testDb
        .query<{ name: string }, []>(
          `SELECT b.name FROM boards b
           JOIN board_members bm ON b.id = bm.board_id
           WHERE bm.user_id = ?`
        )
        .all(testUser.id)

      expect(boards).toHaveLength(0)
    })
  })

  describe('Get Board Details', () => {
    it('should get board with columns', () => {
      const board = createTestBoard(testUser.id)
      createTestColumn(board.id, 'To Do', 0)
      createTestColumn(board.id, 'Done', 1)

      const columns = testDb
        .query<
          { name: string; position: number },
          []
        >('SELECT name, position FROM columns WHERE board_id = ? ORDER BY position')
        .all(board.id)

      expect(columns).toHaveLength(2)
      expect(columns[0].name).toBe('To Do')
      expect(columns[1].name).toBe('Done')
    })
  })

  describe('Update Board', () => {
    it('should update board name', () => {
      const board = createTestBoard(testUser.id, 'Old Name')

      testDb.run('UPDATE boards SET name = ? WHERE id = ?', ['New Name', board.id])

      const updated = testDb
        .query<{ name: string }, []>('SELECT name FROM boards WHERE id = ?')
        .get(board.id)

      expect(updated?.name).toBe('New Name')
    })
  })

  describe('Delete Board', () => {
    it('should delete board', () => {
      const board = createTestBoard(testUser.id)

      testDb.run('DELETE FROM boards WHERE id = ?', [board.id])

      const deleted = testDb
        .query<{ id: number }, []>('SELECT id FROM boards WHERE id = ?')
        .get(board.id)

      expect(deleted).toBeNull()
    })

    it('should cascade delete columns', () => {
      const board = createTestBoard(testUser.id)
      createTestColumn(board.id, 'Column 1')

      testDb.run('DELETE FROM boards WHERE id = ?', [board.id])

      const columns = testDb
        .query<{ id: number }, []>('SELECT id FROM columns WHERE board_id = ?')
        .all(board.id)

      expect(columns).toHaveLength(0)
    })
  })
})
