import { useState, useCallback } from 'react'
import { useUpdateCard, useDeleteCard, useArchiveCard, useCreateLabel } from '../api/hooks'
import type { Card, Priority, Subtask, Comment } from '../types'
import {
  PendingLabel,
  ModalMode,
  toggleSubtaskCompletion,
} from '../components/board/cardModalHelpers'

interface UseCardModalFormProps {
  card: Card
  boardId: number
  onClose: () => void
}

export function useCardModalForm({ card, boardId, onClose }: UseCardModalFormProps) {
  // Mode state
  const [mode, setMode] = useState<ModalMode>('view')

  // Form state
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [dueDate, setDueDate] = useState(card.dueDate?.slice(0, 16) || '')
  const [priority, setPriority] = useState<Priority | ''>(card.priority || '')
  const [color, setColor] = useState(card.color || '#0ea5e9')
  const [assigneeId, setAssigneeId] = useState<number | ''>(card.assigneeId || '')
  const [selectedLabels, setSelectedLabels] = useState<number[]>(
    card.labels?.map((l) => l.id) || []
  )
  const [pendingLabels, setPendingLabels] = useState<PendingLabel[]>([])
  const [subtasks, setSubtasks] = useState<Subtask[]>(card.subtasks || [])
  const [comments, setComments] = useState<Comment[]>(card.comments || [])

  // API hooks
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()
  const archiveCard = useArchiveCard()
  const createLabel = useCreateLabel(boardId)

  // Mode handlers
  const enterEditMode = useCallback(() => setMode('edit'), [])

  const cancelEdit = useCallback(() => {
    setTitle(card.title)
    setDescription(card.description || '')
    setDueDate(card.dueDate?.slice(0, 16) || '')
    setPriority(card.priority || '')
    setColor(card.color || '#0ea5e9')
    setAssigneeId(card.assigneeId || '')
    setSelectedLabels(card.labels?.map((l) => l.id) || [])
    setSubtasks(card.subtasks || [])
    setComments(card.comments || [])
    setPendingLabels([])
    setMode('view')
  }, [card])

  // Save handler
  const handleSave = async () => {
    try {
      const newLabelIds: number[] = []
      for (const pending of pendingLabels) {
        const newLabel = await createLabel.mutateAsync({
          name: pending.name,
          color: pending.color,
        })
        newLabelIds.push(newLabel.id)
      }

      const allLabelIds = [...selectedLabels, ...newLabelIds]

      await updateCard.mutateAsync({
        cardId: card.id,
        data: {
          title,
          description: description || null,
          dueDate: dueDate || null,
          priority: priority || null,
          color,
          assigneeId: assigneeId || null,
          labelIds: allLabelIds,
          subtasks,
          comments,
        },
      })
      setPendingLabels([])
      setMode('view')
    } catch (error) {
      console.error('Failed to update card:', error)
    }
  }

  // Archive handler
  const handleArchive = async () => {
    await archiveCard.mutateAsync(card.id)
    onClose()
  }

  // Delete handler
  const handleDelete = async () => {
    if (confirm('Are you sure you want to permanently delete this card? This cannot be undone.')) {
      await deleteCard.mutateAsync(card.id)
      onClose()
    }
  }

  // Label handlers
  const toggleLabel = useCallback((labelId: number) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    )
  }, [])

  const addPendingLabel = useCallback((label: PendingLabel) => {
    setPendingLabels((prev) => [...prev, label])
  }, [])

  const removePendingLabel = useCallback((name: string) => {
    setPendingLabels((prev) => prev.filter((l) => l.name !== name))
  }, [])

  // Subtask handlers
  const handleToggleSubtask = useCallback(
    (id: string) => {
      const newSubtasks = toggleSubtaskCompletion(subtasks, id)
      setSubtasks(newSubtasks)

      // Auto-save subtask toggle even in view mode
      updateCard.mutate({
        cardId: card.id,
        data: { subtasks: newSubtasks },
      })
    },
    [subtasks, card.id, updateCard]
  )

  const handleAddSubtask = useCallback((subtask: Subtask) => {
    setSubtasks((prev) => [...prev, subtask])
  }, [])

  const handleDeleteSubtask = useCallback((id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id))
  }, [])

  // Comment handlers
  const handleAddComment = useCallback(
    (comment: Comment) => {
      const newComments = [...comments, comment]
      setComments(newComments)

      // Auto-save comment immediately
      updateCard.mutate({
        cardId: card.id,
        data: { comments: newComments },
      })
    },
    [comments, card.id, updateCard]
  )

  const handleUpdateComment = useCallback((id: string, content: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content, updatedAt: new Date().toISOString() } : c))
    )
  }, [])

  const handleDeleteComment = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return {
    // State
    mode,
    title,
    description,
    dueDate,
    priority,
    color,
    assigneeId,
    selectedLabels,
    pendingLabels,
    subtasks,
    comments,

    // Setters
    setTitle,
    setDescription,
    setDueDate,
    setPriority,
    setColor,
    setAssigneeId,

    // Mode handlers
    enterEditMode,
    cancelEdit,

    // CRUD handlers
    handleSave,
    handleArchive,
    handleDelete,

    // Label handlers
    toggleLabel,
    addPendingLabel,
    removePendingLabel,

    // Subtask handlers
    handleToggleSubtask,
    handleAddSubtask,
    handleDeleteSubtask,

    // Comment handlers
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,

    // Loading states
    isSaving: updateCard.isPending,
    isArchiving: archiveCard.isPending,
    isDeleting: deleteCard.isPending,
  }
}
