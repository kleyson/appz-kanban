import { describe, it, expect, beforeEach } from 'bun:test'
import { useBoardStore } from '../boardStore'
import type { BoardWithDetails, Card, ColumnWithCards } from '../../types'

const mockBoard: BoardWithDetails = {
  id: 1,
  name: 'Test Board',
  ownerId: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  columns: [
    {
      id: 1,
      boardId: 1,
      name: 'To Do',
      position: 0,
      createdAt: '2024-01-01T00:00:00Z',
      cards: [
        {
          id: 1,
          columnId: 1,
          title: 'Task 1',
          description: null,
          position: 0,
          dueDate: null,
          priority: null,
          color: '#0ea5e9',
          assigneeId: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          labels: [],
          subtasks: [],
          comments: [],
        },
      ],
    },
    {
      id: 2,
      boardId: 1,
      name: 'Done',
      position: 1,
      createdAt: '2024-01-01T00:00:00Z',
      cards: [],
    },
  ],
  labels: [],
  members: [],
}

describe('boardStore', () => {
  beforeEach(() => {
    useBoardStore.setState({ currentBoard: null })
  })

  it('should initialize with null currentBoard', () => {
    const state = useBoardStore.getState()
    expect(state.currentBoard).toBeNull()
  })

  it('should set currentBoard', () => {
    const { setCurrentBoard } = useBoardStore.getState()
    setCurrentBoard(mockBoard)

    const state = useBoardStore.getState()
    expect(state.currentBoard).toEqual(mockBoard)
  })

  it('should add a column', () => {
    const { setCurrentBoard, addColumn } = useBoardStore.getState()
    setCurrentBoard(mockBoard)

    const newColumn: ColumnWithCards = {
      id: 3,
      boardId: 1,
      name: 'In Progress',
      position: 2,
      createdAt: '2024-01-01T00:00:00Z',
      cards: [],
    }

    addColumn(newColumn)

    const state = useBoardStore.getState()
    expect(state.currentBoard?.columns).toHaveLength(3)
    expect(state.currentBoard?.columns[2].name).toBe('In Progress')
  })

  it('should update a column', () => {
    const { setCurrentBoard, updateColumn } = useBoardStore.getState()
    setCurrentBoard(mockBoard)

    updateColumn({ ...mockBoard.columns[0], name: 'Updated Column' })

    const state = useBoardStore.getState()
    expect(state.currentBoard?.columns[0].name).toBe('Updated Column')
  })

  it('should remove a column', () => {
    const { setCurrentBoard, removeColumn } = useBoardStore.getState()
    setCurrentBoard(mockBoard)

    removeColumn(1)

    const state = useBoardStore.getState()
    expect(state.currentBoard?.columns).toHaveLength(1)
    expect(state.currentBoard?.columns[0].id).toBe(2)
  })

  it('should add a card', () => {
    const { setCurrentBoard, addCard } = useBoardStore.getState()
    setCurrentBoard(mockBoard)

    const newCard: Card = {
      id: 2,
      columnId: 1,
      title: 'New Task',
      description: null,
      position: 1,
      dueDate: null,
      priority: null,
      color: '#0ea5e9',
      assigneeId: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      labels: [],
      subtasks: [],
      comments: [],
    }

    addCard(newCard)

    const state = useBoardStore.getState()
    expect(state.currentBoard?.columns[0].cards).toHaveLength(2)
  })

  it('should update a card', () => {
    const { setCurrentBoard, updateCard } = useBoardStore.getState()
    setCurrentBoard(mockBoard)

    updateCard({ ...mockBoard.columns[0].cards[0], title: 'Updated Task' })

    const state = useBoardStore.getState()
    expect(state.currentBoard?.columns[0].cards[0].title).toBe('Updated Task')
  })

  it('should remove a card', () => {
    const { setCurrentBoard, removeCard } = useBoardStore.getState()
    setCurrentBoard(mockBoard)

    removeCard(1)

    const state = useBoardStore.getState()
    expect(state.currentBoard?.columns[0].cards).toHaveLength(0)
  })

  it('should move a card between columns', () => {
    const { setCurrentBoard, moveCard } = useBoardStore.getState()
    setCurrentBoard(mockBoard)

    // Move card from column 1 to column 2
    moveCard(1, 2, 0)

    const state = useBoardStore.getState()
    expect(state.currentBoard?.columns[0].cards).toHaveLength(0)
    expect(state.currentBoard?.columns[1].cards).toHaveLength(1)
    expect(state.currentBoard?.columns[1].cards[0].columnId).toBe(2)
  })
})
