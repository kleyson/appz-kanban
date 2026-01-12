import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useCardModalForm } from '../useCardModalForm'
import type { Card, Subtask, Comment } from '../../types'

// Mock the API hooks
const mockUpdateCardMutate = mock(() => {})
const mockUpdateCardMutateAsync = mock(() => Promise.resolve())
const mockDeleteCardMutateAsync = mock(() => Promise.resolve())
const mockCreateLabelMutateAsync = mock(() => Promise.resolve({ id: 100 }))

mock.module('../../api/hooks', () => ({
  useUpdateCard: () => ({
    mutate: mockUpdateCardMutate,
    mutateAsync: mockUpdateCardMutateAsync,
    isPending: false,
  }),
  useDeleteCard: () => ({
    mutateAsync: mockDeleteCardMutateAsync,
    isPending: false,
  }),
  useArchiveCard: () => ({
    mutateAsync: mock(() => Promise.resolve()),
    isPending: false,
  }),
  useCreateLabel: () => ({
    mutateAsync: mockCreateLabelMutateAsync,
  }),
}))

// Helper to create test card
function createTestCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 1,
    columnId: 1,
    position: 0,
    title: 'Test Card',
    description: 'Test description',
    dueDate: '2024-03-15T10:00:00Z',
    priority: 'medium',
    color: '#0ea5e9',
    assigneeId: 1,
    labels: [{ id: 1, name: 'Bug', color: '#ef4444', boardId: 1 }],
    subtasks: [{ id: 'st-1', title: 'Subtask 1', completed: false }],
    comments: [],
    archivedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('useCardModalForm', () => {
  const mockOnClose = mock(() => {})

  beforeEach(() => {
    mockUpdateCardMutate.mockClear()
    mockUpdateCardMutateAsync.mockClear()
    mockDeleteCardMutateAsync.mockClear()
    mockCreateLabelMutateAsync.mockClear()
    mockOnClose.mockClear()
  })

  describe('initial state', () => {
    it('should initialize with card values', () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      expect(result.current.mode).toBe('view')
      expect(result.current.title).toBe('Test Card')
      expect(result.current.description).toBe('Test description')
      expect(result.current.priority).toBe('medium')
      expect(result.current.color).toBe('#0ea5e9')
      expect(result.current.assigneeId).toBe(1)
      expect(result.current.selectedLabels).toEqual([1])
      expect(result.current.subtasks).toHaveLength(1)
    })

    it('should handle null/undefined card values', () => {
      const card = createTestCard({
        description: null,
        dueDate: null,
        priority: null,
        assigneeId: null,
        labels: undefined,
        subtasks: undefined,
        comments: undefined,
      })
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      expect(result.current.description).toBe('')
      expect(result.current.dueDate).toBe('')
      expect(result.current.priority).toBe('')
      expect(result.current.assigneeId).toBe('')
      expect(result.current.selectedLabels).toEqual([])
      expect(result.current.subtasks).toEqual([])
      expect(result.current.comments).toEqual([])
    })
  })

  describe('mode management', () => {
    it('should enter edit mode', () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      act(() => {
        result.current.enterEditMode()
      })

      expect(result.current.mode).toBe('edit')
    })

    it('should cancel edit and reset values', () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      // Enter edit mode and change values
      act(() => {
        result.current.enterEditMode()
        result.current.setTitle('Modified Title')
        result.current.setDescription('Modified description')
      })

      expect(result.current.title).toBe('Modified Title')

      // Cancel edit
      act(() => {
        result.current.cancelEdit()
      })

      expect(result.current.mode).toBe('view')
      expect(result.current.title).toBe('Test Card')
      expect(result.current.description).toBe('Test description')
    })
  })

  describe('label management', () => {
    it('should toggle label selection', () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      // Add a new label
      act(() => {
        result.current.toggleLabel(2)
      })
      expect(result.current.selectedLabels).toEqual([1, 2])

      // Remove the label
      act(() => {
        result.current.toggleLabel(2)
      })
      expect(result.current.selectedLabels).toEqual([1])
    })

    it('should add pending label', () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      act(() => {
        result.current.addPendingLabel({ name: 'New Label', color: '#22c55e' })
      })

      expect(result.current.pendingLabels).toHaveLength(1)
      expect(result.current.pendingLabels[0].name).toBe('New Label')
    })

    it('should remove pending label', () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      act(() => {
        result.current.addPendingLabel({ name: 'New Label', color: '#22c55e' })
        result.current.removePendingLabel('New Label')
      })

      expect(result.current.pendingLabels).toHaveLength(0)
    })
  })

  describe('subtask management', () => {
    it('should toggle subtask completion and auto-save', () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      act(() => {
        result.current.handleToggleSubtask('st-1')
      })

      expect(result.current.subtasks[0].completed).toBe(true)
      expect(mockUpdateCardMutate).toHaveBeenCalledWith({
        cardId: 1,
        data: {
          subtasks: [{ id: 'st-1', title: 'Subtask 1', completed: true }],
        },
      })
    })

    it('should add subtask', () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      const newSubtask: Subtask = { id: 'st-2', title: 'Subtask 2', completed: false }

      act(() => {
        result.current.handleAddSubtask(newSubtask)
      })

      expect(result.current.subtasks).toHaveLength(2)
      expect(result.current.subtasks[1].title).toBe('Subtask 2')
    })

    it('should delete subtask', () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      act(() => {
        result.current.handleDeleteSubtask('st-1')
      })

      expect(result.current.subtasks).toHaveLength(0)
    })
  })

  describe('comment management', () => {
    it('should add comment and auto-save', () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      const newComment: Comment = {
        id: 'c-1',
        content: 'Test comment',
        authorId: 1,
        authorName: 'Test User',
        createdAt: new Date().toISOString(),
      }

      act(() => {
        result.current.handleAddComment(newComment)
      })

      expect(result.current.comments).toHaveLength(1)
      expect(mockUpdateCardMutate).toHaveBeenCalledWith({
        cardId: 1,
        data: { comments: [newComment] },
      })
    })

    it('should update comment', () => {
      const existingComment: Comment = {
        id: 'c-1',
        content: 'Original',
        authorId: 1,
        authorName: 'Test User',
        createdAt: new Date().toISOString(),
      }
      const card = createTestCard({ comments: [existingComment] })
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      act(() => {
        result.current.handleUpdateComment('c-1', 'Updated content')
      })

      expect(result.current.comments[0].content).toBe('Updated content')
      expect(result.current.comments[0].updatedAt).toBeDefined()
    })

    it('should delete comment', () => {
      const existingComment: Comment = {
        id: 'c-1',
        content: 'To delete',
        authorId: 1,
        authorName: 'Test User',
        createdAt: new Date().toISOString(),
      }
      const card = createTestCard({ comments: [existingComment] })
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      act(() => {
        result.current.handleDeleteComment('c-1')
      })

      expect(result.current.comments).toHaveLength(0)
    })
  })

  describe('save functionality', () => {
    it('should save card changes', async () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      act(() => {
        result.current.enterEditMode()
        result.current.setTitle('Updated Title')
      })

      await act(async () => {
        await result.current.handleSave()
      })

      expect(mockUpdateCardMutateAsync).toHaveBeenCalledWith({
        cardId: 1,
        data: expect.objectContaining({
          title: 'Updated Title',
        }),
      })
      expect(result.current.mode).toBe('view')
    })

    it('should create pending labels before saving', async () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      act(() => {
        result.current.enterEditMode()
        result.current.addPendingLabel({ name: 'New Label', color: '#22c55e' })
      })

      await act(async () => {
        await result.current.handleSave()
      })

      expect(mockCreateLabelMutateAsync).toHaveBeenCalledWith({
        name: 'New Label',
        color: '#22c55e',
      })
      expect(mockUpdateCardMutateAsync).toHaveBeenCalledWith({
        cardId: 1,
        data: expect.objectContaining({
          labelIds: [1, 100], // Original + new label
        }),
      })
    })
  })

  describe('delete functionality', () => {
    it('should delete card and close modal', async () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      // Mock confirm
      globalThis.confirm = mock(() => true)

      await act(async () => {
        await result.current.handleDelete()
      })

      expect(mockDeleteCardMutateAsync).toHaveBeenCalledWith(1)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should not delete card when confirm is cancelled', async () => {
      const card = createTestCard()
      const { result } = renderHook(() =>
        useCardModalForm({ card, boardId: 1, onClose: mockOnClose })
      )

      // Mock confirm to return false
      globalThis.confirm = mock(() => false)

      await act(async () => {
        await result.current.handleDelete()
      })

      expect(mockDeleteCardMutateAsync).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })
})
