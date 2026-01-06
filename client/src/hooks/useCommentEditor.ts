import { useState, useCallback, useMemo } from 'react'
import type { Comment } from '../types'
import { createComment } from '../components/board/cardModalHelpers'

type TabMode = 'write' | 'preview'

interface UseCommentEditorProps {
  comments: Comment[]
  currentUserId: number
  currentUserName: string
  onAddComment: (comment: Comment) => void
  onUpdateComment: (id: string, content: string) => void
}

export function useCommentEditor({
  comments,
  currentUserId,
  currentUserName,
  onAddComment,
  onUpdateComment,
}: UseCommentEditorProps) {
  // New comment state
  const [newComment, setNewComment] = useState('')
  const [newCommentTab, setNewCommentTab] = useState<TabMode>('write')

  // Editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [editingTab, setEditingTab] = useState<TabMode>('write')

  // Sorted comments (newest first)
  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [comments]
  )

  // Add new comment
  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return
    const comment = createComment(newComment, currentUserId, currentUserName)
    onAddComment(comment)
    setNewComment('')
    setNewCommentTab('write')
  }, [newComment, currentUserId, currentUserName, onAddComment])

  // Start editing a comment
  const handleStartEdit = useCallback((comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
    setEditingTab('write')
  }, [])

  // Save edited comment
  const handleSaveEdit = useCallback(() => {
    if (!editingCommentId || !editingContent.trim()) return
    onUpdateComment(editingCommentId, editingContent.trim())
    setEditingCommentId(null)
    setEditingContent('')
    setEditingTab('write')
  }, [editingCommentId, editingContent, onUpdateComment])

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null)
    setEditingContent('')
    setEditingTab('write')
  }, [])

  // Keyboard handler for Cmd/Ctrl+Enter submit
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, onSubmit: () => void) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onSubmit()
      }
    },
    []
  )

  return {
    // New comment
    newComment,
    setNewComment,
    newCommentTab,
    setNewCommentTab,
    handleAddComment,

    // Editing
    editingCommentId,
    editingContent,
    setEditingContent,
    editingTab,
    setEditingTab,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,

    // Utils
    sortedComments,
    handleKeyDown,
  }
}
