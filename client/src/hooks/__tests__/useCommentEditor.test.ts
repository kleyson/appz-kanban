import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useCommentEditor } from '../useCommentEditor'
import type { Comment } from '../../types'

// Mock the cardModalHelpers
mock.module('../../components/board/cardModalHelpers', () => ({
  createComment: (content: string, authorId: number, authorName: string) => ({
    id: 'mock-uuid',
    content: content.trim(),
    authorId,
    authorName,
    createdAt: new Date().toISOString(),
  }),
}))

// Helper to create test comments
function createTestComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'c-1',
    content: 'Test comment',
    authorId: 1,
    authorName: 'Test User',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('useCommentEditor', () => {
  const mockOnAddComment = mock(() => {})
  const mockOnUpdateComment = mock(() => {})

  beforeEach(() => {
    mockOnAddComment.mockClear()
    mockOnUpdateComment.mockClear()
  })

  describe('initial state', () => {
    it('should initialize with empty new comment', () => {
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      expect(result.current.newComment).toBe('')
      expect(result.current.newCommentTab).toBe('write')
      expect(result.current.editingCommentId).toBeNull()
    })

    it('should return empty sorted comments for empty array', () => {
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      expect(result.current.sortedComments).toEqual([])
    })
  })

  describe('sorted comments', () => {
    it('should sort comments by createdAt descending (newest first)', () => {
      const oldComment = createTestComment({
        id: 'c-1',
        createdAt: '2024-01-01T10:00:00Z',
      })
      const newComment = createTestComment({
        id: 'c-2',
        createdAt: '2024-01-02T10:00:00Z',
      })

      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [oldComment, newComment],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      expect(result.current.sortedComments[0].id).toBe('c-2')
      expect(result.current.sortedComments[1].id).toBe('c-1')
    })
  })

  describe('new comment handling', () => {
    it('should update new comment text', () => {
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      act(() => {
        result.current.setNewComment('New comment text')
      })

      expect(result.current.newComment).toBe('New comment text')
    })

    it('should switch new comment tab', () => {
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      act(() => {
        result.current.setNewCommentTab('preview')
      })

      expect(result.current.newCommentTab).toBe('preview')
    })

    it('should add comment and reset state', () => {
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      act(() => {
        result.current.setNewComment('My new comment')
        result.current.setNewCommentTab('preview')
      })

      act(() => {
        result.current.handleAddComment()
      })

      expect(mockOnAddComment).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'My new comment',
          authorId: 1,
          authorName: 'Test User',
        })
      )
      expect(result.current.newComment).toBe('')
      expect(result.current.newCommentTab).toBe('write')
    })

    it('should not add comment when empty', () => {
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      act(() => {
        result.current.handleAddComment()
      })

      expect(mockOnAddComment).not.toHaveBeenCalled()
    })

    it('should not add comment when only whitespace', () => {
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      act(() => {
        result.current.setNewComment('   ')
        result.current.handleAddComment()
      })

      expect(mockOnAddComment).not.toHaveBeenCalled()
    })
  })

  describe('comment editing', () => {
    it('should start editing a comment', () => {
      const comment = createTestComment({ content: 'Original content' })
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [comment],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      act(() => {
        result.current.handleStartEdit(comment)
      })

      expect(result.current.editingCommentId).toBe('c-1')
      expect(result.current.editingContent).toBe('Original content')
      expect(result.current.editingTab).toBe('write')
    })

    it('should update editing content', () => {
      const comment = createTestComment()
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [comment],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      act(() => {
        result.current.handleStartEdit(comment)
        result.current.setEditingContent('Updated content')
      })

      expect(result.current.editingContent).toBe('Updated content')
    })

    it('should switch editing tab', () => {
      const comment = createTestComment()
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [comment],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      act(() => {
        result.current.handleStartEdit(comment)
        result.current.setEditingTab('preview')
      })

      expect(result.current.editingTab).toBe('preview')
    })

    it('should save edited comment and reset state', () => {
      const comment = createTestComment()
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [comment],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      act(() => {
        result.current.handleStartEdit(comment)
        result.current.setEditingContent('Updated content')
        result.current.setEditingTab('preview')
      })

      act(() => {
        result.current.handleSaveEdit()
      })

      expect(mockOnUpdateComment).toHaveBeenCalledWith('c-1', 'Updated content')
      expect(result.current.editingCommentId).toBeNull()
      expect(result.current.editingContent).toBe('')
      expect(result.current.editingTab).toBe('write')
    })

    it('should not save empty edited comment', () => {
      const comment = createTestComment()
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [comment],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      act(() => {
        result.current.handleStartEdit(comment)
        result.current.setEditingContent('   ')
      })

      act(() => {
        result.current.handleSaveEdit()
      })

      expect(mockOnUpdateComment).not.toHaveBeenCalled()
    })

    it('should cancel editing and reset state', () => {
      const comment = createTestComment()
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [comment],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      act(() => {
        result.current.handleStartEdit(comment)
        result.current.setEditingContent('Modified')
        result.current.setEditingTab('preview')
      })

      act(() => {
        result.current.handleCancelEdit()
      })

      expect(result.current.editingCommentId).toBeNull()
      expect(result.current.editingContent).toBe('')
      expect(result.current.editingTab).toBe('write')
    })
  })

  describe('keyboard handling', () => {
    it('should call onSubmit on Cmd+Enter', () => {
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      const mockSubmit = mock(() => {})
      const mockPreventDefault = mock(() => {})
      const event = {
        key: 'Enter',
        metaKey: true,
        ctrlKey: false,
        preventDefault: mockPreventDefault,
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>

      act(() => {
        result.current.handleKeyDown(event, mockSubmit)
      })

      expect(mockPreventDefault).toHaveBeenCalled()
      expect(mockSubmit).toHaveBeenCalled()
    })

    it('should call onSubmit on Ctrl+Enter', () => {
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      const mockSubmit = mock(() => {})
      const mockPreventDefault = mock(() => {})
      const event = {
        key: 'Enter',
        metaKey: false,
        ctrlKey: true,
        preventDefault: mockPreventDefault,
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>

      act(() => {
        result.current.handleKeyDown(event, mockSubmit)
      })

      expect(mockPreventDefault).toHaveBeenCalled()
      expect(mockSubmit).toHaveBeenCalled()
    })

    it('should not call onSubmit on regular Enter', () => {
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      const mockSubmit = mock(() => {})
      const mockPreventDefault = mock(() => {})
      const event = {
        key: 'Enter',
        metaKey: false,
        ctrlKey: false,
        preventDefault: mockPreventDefault,
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>

      act(() => {
        result.current.handleKeyDown(event, mockSubmit)
      })

      expect(mockPreventDefault).not.toHaveBeenCalled()
      expect(mockSubmit).not.toHaveBeenCalled()
    })

    it('should not call onSubmit on other keys with Cmd', () => {
      const { result } = renderHook(() =>
        useCommentEditor({
          comments: [],
          currentUserId: 1,
          currentUserName: 'Test User',
          onAddComment: mockOnAddComment,
          onUpdateComment: mockOnUpdateComment,
        })
      )

      const mockSubmit = mock(() => {})
      const mockPreventDefault = mock(() => {})
      const event = {
        key: 'a',
        metaKey: true,
        ctrlKey: false,
        preventDefault: mockPreventDefault,
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>

      act(() => {
        result.current.handleKeyDown(event, mockSubmit)
      })

      expect(mockPreventDefault).not.toHaveBeenCalled()
      expect(mockSubmit).not.toHaveBeenCalled()
    })
  })
})
