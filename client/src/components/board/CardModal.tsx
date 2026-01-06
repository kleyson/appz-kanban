import { useCallback } from 'react'
import { useEscapeKey, useCardModalForm } from '../../hooks'
import { useAuthStore } from '../../stores/authStore'
import type { Card, Label, BoardMember } from '../../types'
import { formatDateTime } from '../../utils/dateUtils'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from '../ui'
import CardLabelsSection from './CardLabelsSection'
import CardDescriptionEditor from './CardDescriptionEditor'
import CardSubtasksSection from './CardSubtasksSection'
import CardCommentsSection from './CardCommentsSection'
import CardMetadataSidebar from './CardMetadataSidebar'

interface CardModalProps {
  card: Card
  boardId: number
  labels: Label[]
  members: BoardMember[]
  onClose: () => void
}

export default function CardModal({ card, boardId, labels, members, onClose }: CardModalProps) {
  const user = useAuthStore((state) => state.user)

  const {
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
    setTitle,
    setDescription,
    setDueDate,
    setPriority,
    setColor,
    setAssigneeId,
    enterEditMode,
    cancelEdit,
    handleSave,
    handleDelete,
    toggleLabel,
    addPendingLabel,
    removePendingLabel,
    handleToggleSubtask,
    handleAddSubtask,
    handleDeleteSubtask,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    isSaving,
  } = useCardModalForm({ card, boardId, onClose })

  const handleEscapeKey = useCallback(() => {
    if (mode === 'edit') {
      cancelEdit()
    } else {
      onClose()
    }
  }, [mode, cancelEdit, onClose])

  useEscapeKey(handleEscapeKey)

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
            <h2
              className="text-xl font-bold text-white cursor-pointer hover:text-primary-300 transition-colors"
              onDoubleClick={enterEditMode}
              title="Double-click to edit"
            >
              {title}
            </h2>
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
            onAddPendingLabel={addPendingLabel}
            onRemovePendingLabel={removePendingLabel}
            onEnterEditMode={enterEditMode}
          />

          <CardDescriptionEditor
            description={description}
            mode={mode}
            onChange={setDescription}
            onEnterEditMode={enterEditMode}
          />

          <CardSubtasksSection
            subtasks={subtasks}
            mode={mode}
            onToggleSubtask={handleToggleSubtask}
            onAddSubtask={handleAddSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onEnterEditMode={enterEditMode}
          />

          <CardCommentsSection
            comments={comments}
            mode={mode}
            currentUserId={user?.id || 0}
            currentUserName={user?.displayName || 'Unknown'}
            onAddComment={handleAddComment}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
            onEnterEditMode={enterEditMode}
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
          onEnterEditMode={enterEditMode}
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
                isLoading={isSaving}
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
