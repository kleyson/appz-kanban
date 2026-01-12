import { describe, it, expect, mock, beforeEach, afterAll } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useColumnForm } from '../useColumnForm'
import type { ColumnWithCards } from '../../types'

// Mock the API hooks
const mockUpdateColumnMutateAsync = mock(() => Promise.resolve())
const mockDeleteColumnMutateAsync = mock(() => Promise.resolve())
const mockCreateCardMutateAsync = mock(() => Promise.resolve({ id: 99 }))

mock.module('../../api/hooks', () => ({
  useUpdateColumn: () => ({
    mutateAsync: mockUpdateColumnMutateAsync,
    isPending: false,
  }),
  useDeleteColumn: () => ({
    mutateAsync: mockDeleteColumnMutateAsync,
    isPending: false,
  }),
  useCreateCard: () => ({
    mutateAsync: mockCreateCardMutateAsync,
    isPending: false,
  }),
}))

// Mock confirm dialog
const originalConfirm = globalThis.confirm
beforeEach(() => {
  globalThis.confirm = mock(() => true)
  mockUpdateColumnMutateAsync.mockClear()
  mockDeleteColumnMutateAsync.mockClear()
  mockCreateCardMutateAsync.mockClear()
})

function createColumn(id: number, name: string): ColumnWithCards {
  return {
    id,
    boardId: 1,
    name,
    position: 0,
    isDone: false,
    createdAt: new Date().toISOString(),
    cards: [],
  }
}

describe('useColumnForm', () => {
  describe('column name editing', () => {
    it('should initialize with column name and not editing', () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      expect(result.current.name).toBe('Test Column')
      expect(result.current.isEditing).toBe(false)
    })

    it('should start editing when startEditing is called', () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.startEditing()
      })

      expect(result.current.isEditing).toBe(true)
    })

    it('should cancel editing and reset name', () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.startEditing()
        result.current.setName('New Name')
      })

      expect(result.current.name).toBe('New Name')

      act(() => {
        result.current.cancelEditing()
      })

      expect(result.current.isEditing).toBe(false)
      expect(result.current.name).toBe('Test Column')
    })

    it('should update name when handleUpdateName is called with changed name', async () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.startEditing()
        result.current.setName('New Name')
      })

      await act(async () => {
        await result.current.handleUpdateName()
      })

      expect(mockUpdateColumnMutateAsync).toHaveBeenCalledWith({
        columnId: 1,
        data: { name: 'New Name' },
      })
      expect(result.current.isEditing).toBe(false)
    })

    it('should not update when name is unchanged', async () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.startEditing()
      })

      await act(async () => {
        await result.current.handleUpdateName()
      })

      expect(mockUpdateColumnMutateAsync).not.toHaveBeenCalled()
      expect(result.current.isEditing).toBe(false)
    })

    it('should not update when name is empty', async () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.startEditing()
        result.current.setName('')
      })

      await act(async () => {
        await result.current.handleUpdateName()
      })

      expect(mockUpdateColumnMutateAsync).not.toHaveBeenCalled()
      expect(result.current.name).toBe('Test Column')
    })

    it('should trim name before updating', async () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.startEditing()
        result.current.setName('  New Name  ')
      })

      await act(async () => {
        await result.current.handleUpdateName()
      })

      expect(mockUpdateColumnMutateAsync).toHaveBeenCalledWith({
        columnId: 1,
        data: { name: 'New Name' },
      })
    })
  })

  describe('add card form', () => {
    it('should initialize with showAddCard false and empty title', () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      expect(result.current.showAddCard).toBe(false)
      expect(result.current.newCardTitle).toBe('')
    })

    it('should open add card form', () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.openAddCard()
      })

      expect(result.current.showAddCard).toBe(true)
    })

    it('should close add card form and clear title', () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.openAddCard()
        result.current.setNewCardTitle('New Card')
      })

      expect(result.current.newCardTitle).toBe('New Card')

      act(() => {
        result.current.closeAddCard()
      })

      expect(result.current.showAddCard).toBe(false)
      expect(result.current.newCardTitle).toBe('')
    })

    it('should create card when handleAddCard is called', async () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.openAddCard()
        result.current.setNewCardTitle('New Card Title')
      })

      await act(async () => {
        const mockEvent = { preventDefault: mock(() => {}) }
        await result.current.handleAddCard(mockEvent as any)
      })

      expect(mockCreateCardMutateAsync).toHaveBeenCalledWith({
        title: 'New Card Title',
      })
      expect(result.current.newCardTitle).toBe('')
      expect(result.current.showAddCard).toBe(false)
    })

    it('should trim card title before creating', async () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.openAddCard()
        result.current.setNewCardTitle('  New Card  ')
      })

      await act(async () => {
        const mockEvent = { preventDefault: mock(() => {}) }
        await result.current.handleAddCard(mockEvent as any)
      })

      expect(mockCreateCardMutateAsync).toHaveBeenCalledWith({
        title: 'New Card',
      })
    })

    it('should not create card with empty title', async () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.openAddCard()
        result.current.setNewCardTitle('   ')
      })

      await act(async () => {
        const mockEvent = { preventDefault: mock(() => {}) }
        await result.current.handleAddCard(mockEvent as any)
      })

      expect(mockCreateCardMutateAsync).not.toHaveBeenCalled()
    })
  })

  describe('menu', () => {
    it('should initialize with menu closed', () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      expect(result.current.showMenu).toBe(false)
    })

    it('should toggle menu', () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.toggleMenu()
      })

      expect(result.current.showMenu).toBe(true)

      act(() => {
        result.current.toggleMenu()
      })

      expect(result.current.showMenu).toBe(false)
    })

    it('should close menu', () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      act(() => {
        result.current.toggleMenu()
      })

      expect(result.current.showMenu).toBe(true)

      act(() => {
        result.current.closeMenu()
      })

      expect(result.current.showMenu).toBe(false)
    })
  })

  describe('delete', () => {
    it('should delete column when confirmed', async () => {
      globalThis.confirm = mock(() => true)
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      await act(async () => {
        await result.current.handleDelete()
      })

      expect(mockDeleteColumnMutateAsync).toHaveBeenCalledWith(1)
      expect(result.current.showMenu).toBe(false)
    })

    it('should not delete column when cancelled', async () => {
      globalThis.confirm = mock(() => false)
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      await act(async () => {
        await result.current.handleDelete()
      })

      expect(mockDeleteColumnMutateAsync).not.toHaveBeenCalled()
      expect(result.current.showMenu).toBe(false)
    })

    it('should show confirmation with column name', async () => {
      const confirmMock = mock(() => true)
      globalThis.confirm = confirmMock
      const column = createColumn(1, 'My Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      await act(async () => {
        await result.current.handleDelete()
      })

      expect(confirmMock).toHaveBeenCalledWith('Delete "My Column" and all its cards?')
    })
  })

  describe('loading states', () => {
    it('should expose loading states from mutations', () => {
      const column = createColumn(1, 'Test Column')
      const { result } = renderHook(() => useColumnForm({ column }))

      // These come from the mocked hooks with isPending: false
      expect(result.current.isUpdating).toBe(false)
      expect(result.current.isDeleting).toBe(false)
      expect(result.current.isCreatingCard).toBe(false)
    })
  })
})

// Restore original confirm
afterAll(() => {
  globalThis.confirm = originalConfirm
})
