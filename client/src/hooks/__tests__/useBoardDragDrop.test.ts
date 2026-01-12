import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useBoardDragDrop } from '../useBoardDragDrop'
import type { BoardWithDetails, Card, ColumnWithCards } from '../../types'

// Mock the API hooks
const mockMoveCardMutateAsync = mock(() => Promise.resolve())
const mockReorderColumnsMutateAsync = mock(() => Promise.resolve())

mock.module('../../api/hooks', () => ({
  useMoveCard: () => ({
    mutateAsync: mockMoveCardMutateAsync,
  }),
  useReorderColumns: () => ({
    mutateAsync: mockReorderColumnsMutateAsync,
  }),
}))

// Helper to create test data
function createCard(id: number, columnId: number, position: number): Card {
  return {
    id,
    columnId,
    position,
    title: `Card ${id}`,
    description: null,
    dueDate: null,
    priority: null,
    color: null,
    assigneeId: null,
    subtasks: [],
    comments: [],
    archivedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function createColumn(id: number, cards: Card[]): ColumnWithCards {
  return {
    id,
    boardId: 1,
    name: `Column ${id}`,
    position: id - 1,
    isDone: false,
    createdAt: new Date().toISOString(),
    cards,
  }
}

function createBoard(columns: ColumnWithCards[]): BoardWithDetails {
  return {
    id: 1,
    name: 'Test Board',
    ownerId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    columns,
    labels: [],
    members: [],
  }
}

describe('useBoardDragDrop', () => {
  beforeEach(() => {
    mockMoveCardMutateAsync.mockClear()
    mockReorderColumnsMutateAsync.mockClear()
  })

  describe('initial state', () => {
    it('should initialize with null active card and column', () => {
      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board: null }))

      expect(result.current.activeCard).toBeNull()
      expect(result.current.activeColumn).toBeNull()
    })

    it('should return empty columnIds when board is null', () => {
      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board: null }))

      expect(result.current.columnIds).toEqual([])
    })

    it('should return empty cardMap when board is null', () => {
      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board: null }))

      expect(result.current.cardMap.size).toBe(0)
    })

    it('should build columnIds from board columns', () => {
      const columns = [createColumn(1, []), createColumn(2, []), createColumn(3, [])]
      const board = createBoard(columns)

      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board }))

      expect(result.current.columnIds).toEqual(['column-1', 'column-2', 'column-3'])
    })

    it('should build cardMap from board cards', () => {
      const card1 = createCard(1, 1, 0)
      const card2 = createCard(2, 1, 1)
      const card3 = createCard(3, 2, 0)
      const columns = [createColumn(1, [card1, card2]), createColumn(2, [card3])]
      const board = createBoard(columns)

      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board }))

      expect(result.current.cardMap.size).toBe(3)
      expect(result.current.cardMap.get(1)).toEqual(card1)
      expect(result.current.cardMap.get(2)).toEqual(card2)
      expect(result.current.cardMap.get(3)).toEqual(card3)
    })
  })

  describe('handleDragStart', () => {
    it('should set activeCard when dragging a card', () => {
      const card1 = createCard(1, 1, 0)
      const columns = [createColumn(1, [card1])]
      const board = createBoard(columns)

      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board }))

      act(() => {
        result.current.handleDragStart({
          active: { id: 1 },
        } as any)
      })

      expect(result.current.activeCard).toEqual(card1)
      expect(result.current.activeColumn).toBeNull()
    })

    it('should set activeColumn when dragging a column', () => {
      const column1 = createColumn(1, [])
      const board = createBoard([column1])

      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board }))

      act(() => {
        result.current.handleDragStart({
          active: { id: 'column-1' },
        } as any)
      })

      expect(result.current.activeColumn).toEqual(column1)
      expect(result.current.activeCard).toBeNull()
    })

    it('should not set anything for unknown drag id', () => {
      const board = createBoard([createColumn(1, [])])

      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board }))

      act(() => {
        result.current.handleDragStart({
          active: { id: 999 },
        } as any)
      })

      expect(result.current.activeCard).toBeNull()
      expect(result.current.activeColumn).toBeNull()
    })
  })

  describe('handleDragEnd', () => {
    it('should clear active card/column on drag end', async () => {
      const card1 = createCard(1, 1, 0)
      const columns = [createColumn(1, [card1])]
      const board = createBoard(columns)

      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board }))

      // Start dragging
      act(() => {
        result.current.handleDragStart({
          active: { id: 1 },
        } as any)
      })

      expect(result.current.activeCard).not.toBeNull()

      // End dragging
      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 1 },
          over: null,
        } as any)
      })

      expect(result.current.activeCard).toBeNull()
      expect(result.current.activeColumn).toBeNull()
    })

    it('should not move card when dropped on same position', async () => {
      const card1 = createCard(1, 1, 0)
      const columns = [createColumn(1, [card1])]
      const board = createBoard(columns)

      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board }))

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 1 },
          over: { id: 1 },
        } as any)
      })

      expect(mockMoveCardMutateAsync).not.toHaveBeenCalled()
    })

    it('should move card to different column', async () => {
      const card1 = createCard(1, 1, 0)
      const columns = [createColumn(1, [card1]), createColumn(2, [])]
      const board = createBoard(columns)

      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board }))

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 1 },
          over: { id: 'column-2' },
        } as any)
      })

      expect(mockMoveCardMutateAsync).toHaveBeenCalledWith({
        cardId: 1,
        data: {
          columnId: 2,
          position: 0,
        },
      })
    })

    it('should move card to position of another card', async () => {
      const card1 = createCard(1, 1, 0)
      const card2 = createCard(2, 1, 1)
      const columns = [createColumn(1, [card1, card2])]
      const board = createBoard(columns)

      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board }))

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 1 },
          over: { id: 2 },
        } as any)
      })

      expect(mockMoveCardMutateAsync).toHaveBeenCalledWith({
        cardId: 1,
        data: {
          columnId: 1,
          position: 1,
        },
      })
    })

    it('should reorder columns when dropping column on another column', async () => {
      const columns = [createColumn(1, []), createColumn(2, []), createColumn(3, [])]
      const board = createBoard(columns)

      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board }))

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 'column-1' },
          over: { id: 'column-3' },
        } as any)
      })

      expect(mockReorderColumnsMutateAsync).toHaveBeenCalledWith([2, 3, 1])
    })

    it('should not reorder columns when dropped on same column', async () => {
      const columns = [createColumn(1, [])]
      const board = createBoard(columns)

      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board }))

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 'column-1' },
          over: { id: 'column-1' },
        } as any)
      })

      expect(mockReorderColumnsMutateAsync).not.toHaveBeenCalled()
    })

    it('should do nothing when over is null', async () => {
      const card1 = createCard(1, 1, 0)
      const columns = [createColumn(1, [card1])]
      const board = createBoard(columns)

      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board }))

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 1 },
          over: null,
        } as any)
      })

      expect(mockMoveCardMutateAsync).not.toHaveBeenCalled()
      expect(mockReorderColumnsMutateAsync).not.toHaveBeenCalled()
    })

    it('should do nothing when board is null', async () => {
      const { result } = renderHook(() => useBoardDragDrop({ boardId: 1, board: null }))

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 1 },
          over: { id: 'column-1' },
        } as any)
      })

      expect(mockMoveCardMutateAsync).not.toHaveBeenCalled()
      expect(mockReorderColumnsMutateAsync).not.toHaveBeenCalled()
    })
  })
})
