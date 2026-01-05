import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useUpdateColumn, useDeleteColumn, useCreateCard } from '../../api/hooks'
import KanbanCard from './KanbanCard'
import type { ColumnWithCards, Card } from '../../types'

interface ColumnProps {
  column: ColumnWithCards
  onCardClick: (card: Card) => void
  isDragging?: boolean
}

export default function Column({ column, onCardClick, isDragging: isDraggingProp }: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(column.name)
  const [showAddCard, setShowAddCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [showMenu, setShowMenu] = useState(false)

  const updateColumn = useUpdateColumn()
  const deleteColumn = useDeleteColumn()
  const createCard = useCreateCard(column.id)

  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${column.id}`,
  })

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleUpdateName = async () => {
    if (name.trim() && name !== column.name) {
      await updateColumn.mutateAsync({ columnId: column.id, data: { name: name.trim() } })
    } else {
      setName(column.name)
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (confirm(`Delete "${column.name}" and all its cards?`)) {
      await deleteColumn.mutateAsync(column.id)
    }
    setShowMenu(false)
  }

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCardTitle.trim()) return

    try {
      await createCard.mutateAsync({ title: newCardTitle.trim() })
      setNewCardTitle('')
      setShowAddCard(false)
    } catch (error) {
      console.error('Failed to create card:', error)
    }
  }

  return (
    <div
      ref={setSortableNodeRef}
      style={style}
      className={`w-80 flex-shrink-0 flex flex-col bg-slate-800/40 backdrop-blur-sm border rounded-xl transition-colors ${
        isOver ? 'border-primary-500/50 bg-slate-800/60' : 'border-slate-700/50'
      } ${isDragging || isDraggingProp ? 'shadow-2xl' : ''}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing touch-none"
            title="Drag to reorder"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </button>

          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleUpdateName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateName()
                if (e.key === 'Escape') {
                  setName(column.name)
                  setIsEditing(false)
                }
              }}
              className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              autoFocus
            />
          ) : (
            <h3
              onClick={() => setIsEditing(true)}
              className="font-semibold text-white cursor-pointer hover:text-primary-300 transition-colors truncate"
            >
              {column.name}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 bg-slate-700/50 rounded-full text-xs text-slate-400">
            {column.cards.length}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 min-w-[140px]">
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    Rename
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setDroppableNodeRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[100px]"
      >
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <KanbanCard key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </SortableContext>

        {column.cards.length === 0 && !showAddCard && (
          <div className="text-center py-8 text-slate-500 text-sm">No cards yet</div>
        )}
      </div>

      {/* Add Card */}
      <div className="p-3 border-t border-slate-700/30">
        {showAddCard ? (
          <form onSubmit={handleAddCard}>
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (newCardTitle.trim()) {
                    handleAddCard(e)
                  }
                }
                if (e.key === 'Escape') {
                  setShowAddCard(false)
                  setNewCardTitle('')
                }
              }}
              placeholder="Enter card title... (Enter to save, Shift+Enter for new line)"
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={!newCardTitle.trim()}
                className="flex-1 py-2 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
              >
                Add Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCard(false)
                  setNewCardTitle('')
                }}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddCard(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700/30 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Card
          </button>
        )}
      </div>
    </div>
  )
}
