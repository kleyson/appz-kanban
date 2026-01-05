import { describe, it, expect, beforeEach } from 'bun:test'
import {
  testDb,
  createTestUser,
  createTestBoard,
  createTestColumn,
  createTestCard,
  createTestLabel,
  setupTests,
} from './setup'

describe('Cards API', () => {
  setupTests()

  let testUser: ReturnType<typeof createTestUser>
  let testBoard: ReturnType<typeof createTestBoard>
  let testColumn: ReturnType<typeof createTestColumn>

  beforeEach(() => {
    testUser = createTestUser()
    testBoard = createTestBoard(testUser.id)
    testColumn = createTestColumn(testBoard.id)
  })

  describe('Create Card', () => {
    it('should create a new card', () => {
      const card = createTestCard(testColumn.id, 'New Card', 0)

      expect(card.id).toBeGreaterThan(0)
      expect(card.title).toBe('New Card')
      expect(card.position).toBe(0)
    })

    it('should create card with all fields', () => {
      testDb.run(
        `INSERT INTO cards (column_id, title, description, position, due_date, priority, color, subtasks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testColumn.id,
          'Full Card',
          'A description',
          0,
          '2024-12-31T23:59:59Z',
          'high',
          '#ff0000',
          JSON.stringify([{ id: '1', title: 'Subtask 1', completed: false }]),
        ]
      )

      const card = testDb
        .query<
          {
            title: string
            description: string
            priority: string
            color: string
            subtasks: string
          },
          []
        >('SELECT title, description, priority, color, subtasks FROM cards WHERE title = ?')
        .get('Full Card')

      expect(card?.description).toBe('A description')
      expect(card?.priority).toBe('high')
      expect(card?.color).toBe('#ff0000')
      expect(JSON.parse(card?.subtasks || '[]')).toHaveLength(1)
    })
  })

  describe('Update Card', () => {
    it('should update card title', () => {
      const card = createTestCard(testColumn.id, 'Old Title')

      testDb.run('UPDATE cards SET title = ? WHERE id = ?', ['New Title', card.id])

      const updated = testDb
        .query<{ title: string }, []>('SELECT title FROM cards WHERE id = ?')
        .get(card.id)

      expect(updated?.title).toBe('New Title')
    })

    it('should update card priority', () => {
      const card = createTestCard(testColumn.id)

      testDb.run('UPDATE cards SET priority = ? WHERE id = ?', ['high', card.id])

      const updated = testDb
        .query<{ priority: string }, []>('SELECT priority FROM cards WHERE id = ?')
        .get(card.id)

      expect(updated?.priority).toBe('high')
    })

    it('should update subtasks', () => {
      const card = createTestCard(testColumn.id)
      const subtasks = [
        { id: '1', title: 'Task 1', completed: false },
        { id: '2', title: 'Task 2', completed: true },
      ]

      testDb.run('UPDATE cards SET subtasks = ? WHERE id = ?', [JSON.stringify(subtasks), card.id])

      const updated = testDb
        .query<{ subtasks: string }, []>('SELECT subtasks FROM cards WHERE id = ?')
        .get(card.id)

      const parsedSubtasks = JSON.parse(updated?.subtasks || '[]')
      expect(parsedSubtasks).toHaveLength(2)
      expect(parsedSubtasks[1].completed).toBe(true)
    })
  })

  describe('Move Card', () => {
    it('should move card to another column', () => {
      const column2 = createTestColumn(testBoard.id, 'Column 2', 1)
      const card = createTestCard(testColumn.id)

      testDb.run('UPDATE cards SET column_id = ?, position = ? WHERE id = ?', [
        column2.id,
        0,
        card.id,
      ])

      const updated = testDb
        .query<{ column_id: number }, []>('SELECT column_id FROM cards WHERE id = ?')
        .get(card.id)

      expect(updated?.column_id).toBe(column2.id)
    })

    it('should reorder cards within column', () => {
      const card1 = createTestCard(testColumn.id, 'Card 1', 0)
      const card2 = createTestCard(testColumn.id, 'Card 2', 1)
      const card3 = createTestCard(testColumn.id, 'Card 3', 2)

      // Move card 3 to position 0
      testDb.run('UPDATE cards SET position = ? WHERE id = ?', [0, card3.id])
      testDb.run('UPDATE cards SET position = ? WHERE id = ?', [1, card1.id])
      testDb.run('UPDATE cards SET position = ? WHERE id = ?', [2, card2.id])

      const cards = testDb
        .query<
          { title: string; position: number },
          []
        >('SELECT title, position FROM cards WHERE column_id = ? ORDER BY position')
        .all(testColumn.id)

      expect(cards[0].title).toBe('Card 3')
      expect(cards[1].title).toBe('Card 1')
      expect(cards[2].title).toBe('Card 2')
    })
  })

  describe('Card Labels', () => {
    it('should add label to card', () => {
      const card = createTestCard(testColumn.id)
      const label = createTestLabel(testBoard.id, 'Bug', '#ff0000')

      testDb.run('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [card.id, label.id])

      const cardLabels = testDb
        .query<{ label_id: number }, []>('SELECT label_id FROM card_labels WHERE card_id = ?')
        .all(card.id)

      expect(cardLabels).toHaveLength(1)
      expect(cardLabels[0].label_id).toBe(label.id)
    })

    it('should remove label from card', () => {
      const card = createTestCard(testColumn.id)
      const label = createTestLabel(testBoard.id)

      testDb.run('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [card.id, label.id])
      testDb.run('DELETE FROM card_labels WHERE card_id = ? AND label_id = ?', [card.id, label.id])

      const cardLabels = testDb
        .query<{ label_id: number }, []>('SELECT label_id FROM card_labels WHERE card_id = ?')
        .all(card.id)

      expect(cardLabels).toHaveLength(0)
    })
  })

  describe('Delete Card', () => {
    it('should delete card', () => {
      const card = createTestCard(testColumn.id)

      testDb.run('DELETE FROM cards WHERE id = ?', [card.id])

      const deleted = testDb
        .query<{ id: number }, []>('SELECT id FROM cards WHERE id = ?')
        .get(card.id)

      expect(deleted).toBeNull()
    })

    it('should cascade delete card labels', () => {
      const card = createTestCard(testColumn.id)
      const label = createTestLabel(testBoard.id)

      testDb.run('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [card.id, label.id])
      testDb.run('DELETE FROM cards WHERE id = ?', [card.id])

      const cardLabels = testDb
        .query<{ card_id: number }, []>('SELECT card_id FROM card_labels WHERE card_id = ?')
        .all(card.id)

      expect(cardLabels).toHaveLength(0)
    })
  })
})
