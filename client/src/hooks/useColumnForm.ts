import { useState, useCallback } from 'react'
import { useUpdateColumn, useDeleteColumn, useCreateCard } from '../api/hooks'
import type { ColumnWithCards } from '../types'

interface UseColumnFormProps {
  column: ColumnWithCards
}

interface UseColumnFormReturn {
  // Column name editing
  isEditing: boolean
  name: string
  setName: (name: string) => void
  startEditing: () => void
  cancelEditing: () => void
  handleUpdateName: () => Promise<void>

  // Add card form
  showAddCard: boolean
  newCardTitle: string
  setNewCardTitle: (title: string) => void
  openAddCard: () => void
  closeAddCard: () => void
  handleAddCard: (e: React.FormEvent) => Promise<void>

  // Menu
  showMenu: boolean
  toggleMenu: () => void
  closeMenu: () => void

  // Done toggle
  handleToggleDone: () => Promise<void>

  // Delete
  handleDelete: () => Promise<void>

  // Loading states
  isUpdating: boolean
  isDeleting: boolean
  isCreatingCard: boolean
}

export function useColumnForm({ column }: UseColumnFormProps): UseColumnFormReturn {
  // Column name editing state
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(column.name)

  // Add card form state
  const [showAddCard, setShowAddCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')

  // Menu state
  const [showMenu, setShowMenu] = useState(false)

  // Mutations
  const updateColumn = useUpdateColumn()
  const deleteColumn = useDeleteColumn()
  const createCard = useCreateCard(column.id)

  // Column name editing handlers
  const startEditing = useCallback(() => {
    setIsEditing(true)
  }, [])

  const cancelEditing = useCallback(() => {
    setName(column.name)
    setIsEditing(false)
  }, [column.name])

  const handleUpdateName = useCallback(async () => {
    if (name.trim() && name !== column.name) {
      await updateColumn.mutateAsync({ columnId: column.id, data: { name: name.trim() } })
    } else {
      setName(column.name)
    }
    setIsEditing(false)
  }, [name, column.name, column.id, updateColumn])

  // Add card handlers
  const openAddCard = useCallback(() => {
    setShowAddCard(true)
  }, [])

  const closeAddCard = useCallback(() => {
    setShowAddCard(false)
    setNewCardTitle('')
  }, [])

  const handleAddCard = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newCardTitle.trim()) return

      try {
        await createCard.mutateAsync({ title: newCardTitle.trim() })
        setNewCardTitle('')
        setShowAddCard(false)
      } catch (error) {
        console.error('Failed to create card:', error)
      }
    },
    [newCardTitle, createCard]
  )

  // Menu handlers
  const toggleMenu = useCallback(() => {
    setShowMenu((prev) => !prev)
  }, [])

  const closeMenu = useCallback(() => {
    setShowMenu(false)
  }, [])

  // Done toggle handler
  const handleToggleDone = useCallback(async () => {
    await updateColumn.mutateAsync({ columnId: column.id, data: { isDone: !column.isDone } })
  }, [column.id, column.isDone, updateColumn])

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (confirm(`Delete "${column.name}" and all its cards?`)) {
      await deleteColumn.mutateAsync(column.id)
    }
    setShowMenu(false)
  }, [column.name, column.id, deleteColumn])

  return {
    // Column name editing
    isEditing,
    name,
    setName,
    startEditing,
    cancelEditing,
    handleUpdateName,

    // Add card form
    showAddCard,
    newCardTitle,
    setNewCardTitle,
    openAddCard,
    closeAddCard,
    handleAddCard,

    // Menu
    showMenu,
    toggleMenu,
    closeMenu,

    // Done toggle
    handleToggleDone,

    // Delete
    handleDelete,

    // Loading states
    isUpdating: updateColumn.isPending,
    isDeleting: deleteColumn.isPending,
    isCreatingCard: createCard.isPending,
  }
}
