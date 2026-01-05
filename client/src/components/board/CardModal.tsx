import { useState, useCallback } from 'react'
import { useUpdateCard, useDeleteCard, useCreateLabel } from '../../api/hooks'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import type { Card, Label, BoardMember, Priority, Subtask } from '../../types'
import { formatDateTime } from '../../utils/dateUtils'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from '../ui'
import CardLabelsSection from './CardLabelsSection'
import CardDescriptionEditor from './CardDescriptionEditor'
import CardSubtasksSection from './CardSubtasksSection'
import CardMetadataSidebar from './CardMetadataSidebar'
import { PendingLabel, ModalMode, toggleSubtaskCompletion } from './cardModalHelpers'

interface CardModalProps {
  card: Card
  boardId: number
  labels: Label[]
  members: BoardMember[]
  onClose: () => void
}

export default function CardModal({ card, boardId, labels, members, onClose }: CardModalProps) {
  const [mode, setMode] = useState<ModalMode>('view')
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

  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()
  const createLabel = useCreateLabel(boardId)

  const enterEditMode = () => setMode('edit')

  const cancelEdit = useCallback(() => {
    setTitle(card.title)
    setDescription(card.description || '')
    setDueDate(card.dueDate?.slice(0, 16) || '')
    setPriority(card.priority || '')
    setColor(card.color || '#0ea5e9')
    setAssigneeId(card.assigneeId || '')
    setSelectedLabels(card.labels?.map((l) => l.id) || [])
    setSubtasks(card.subtasks || [])
    setPendingLabels([])
    setMode('view')
  }, [card])

  const handleEscapeKey = useCallback(() => {
    if (mode === 'edit') {
      cancelEdit()
    } else {
      onClose()
    }
  }, [mode, cancelEdit, onClose])

  useEscapeKey(handleEscapeKey)

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
        },
      })
      setPendingLabels([])
      setMode('view')
    } catch (error) {
      console.error('Failed to update card:', error)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this card?')) {
      await deleteCard.mutateAsync(card.id)
      onClose()
    }
  }

  const toggleLabel = (labelId: number) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    )
  }

  const handleToggleSubtask = (id: string) => {
    const newSubtasks = toggleSubtaskCompletion(subtasks, id)
    setSubtasks(newSubtasks)

    // Auto-save subtask toggle even in view mode
    updateCard.mutate({
      cardId: card.id,
      data: { subtasks: newSubtasks },
    })
  }

  const handleAddSubtask = (subtask: Subtask) => {
    setSubtasks([...subtasks, subtask])
  }

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id))
  }

  return (
    <Modal maxWidth="3xl">
      <ModalHeader
        onClose={onClose}
        actions={
          mode === 'view' && (
            <Button onClick={enterEditMode} variant="text" size="sm">
              Edit
            </Button>
          )
        }
      >
        {mode === 'edit' ? (
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="transparent"
            className="text-xl font-bold"
            placeholder="Card title"
          />
        ) : (
          <>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {card.createdAt && (
              <p className="text-sm text-slate-500 mt-1">
                Created {formatDateTime(card.createdAt)}
              </p>
            )}
          </>
        )}
      </ModalHeader>

      <ModalBody className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-6 min-w-0">
          <CardLabelsSection
            labels={labels}
            selectedLabels={selectedLabels}
            pendingLabels={pendingLabels}
            mode={mode}
            onToggleLabel={toggleLabel}
            onAddPendingLabel={(label) => setPendingLabels([...pendingLabels, label])}
            onRemovePendingLabel={(name) =>
              setPendingLabels(pendingLabels.filter((l) => l.name !== name))
            }
          />

          <CardDescriptionEditor description={description} mode={mode} onChange={setDescription} />

          <CardSubtasksSection
            subtasks={subtasks}
            mode={mode}
            onToggleSubtask={handleToggleSubtask}
            onAddSubtask={handleAddSubtask}
            onDeleteSubtask={handleDeleteSubtask}
          />
        </div>

        {/* Sidebar */}
        <CardMetadataSidebar
          dueDate={dueDate}
          priority={priority}
          assigneeId={assigneeId}
          color={color}
          members={members}
          mode={mode}
          onDueDateChange={setDueDate}
          onPriorityChange={setPriority}
          onAssigneeChange={setAssigneeId}
          onColorChange={setColor}
        />
      </ModalBody>

      <ModalFooter>
        {mode === 'edit' ? (
          <>
            <Button onClick={handleDelete} variant="danger" size="md">
              Delete Card
            </Button>
            <div className="flex gap-3">
              <Button onClick={cancelEdit} variant="ghost" size="md">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!title.trim()}
                isLoading={updateCard.isPending}
                variant="primary"
                size="md"
              >
                Save Changes
              </Button>
            </div>
          </>
        ) : (
          <>
            <div />
            <Button onClick={onClose} variant="ghost" size="md">
              Close
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}
