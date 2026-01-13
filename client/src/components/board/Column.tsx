import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useColumnForm } from '../../hooks/useColumnForm'
import KanbanCard from './KanbanCard'
import type { ColumnWithCards, Card } from '../../types'

interface ColumnProps {
  column: ColumnWithCards
  onCardClick: (card: Card) => void
  isDragging?: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Column({
  column,
  onCardClick,
  isDragging: isDraggingProp,
  isCollapsed = false,
  onToggleCollapse,
}: ColumnProps) {
  const {
    isEditing,
    name,
    setName,
    startEditing,
    cancelEditing,
    handleUpdateName,
    showAddCard,
    newCardTitle,
    setNewCardTitle,
    openAddCard,
    closeAddCard,
    handleAddCard,
    showMenu,
    toggleMenu,
    closeMenu,
    handleToggleDone,
    handleDelete,
  } = useColumnForm({ column })

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

  // Collapsed view
  if (isCollapsed) {
    return (
      <div
        ref={setSortableNodeRef}
        style={style}
        className={`w-12 flex-shrink-0 flex flex-col bg-slate-800/40 backdrop-blur-sm border rounded-xl transition-all ${
          isOver ? 'border-primary-500/50 bg-slate-800/60' : 'border-slate-700/50'
        } ${isDragging || isDraggingProp ? 'shadow-2xl' : ''}`}
      >
        {/* Collapsed Header with drag handle */}
        <div className="flex flex-col items-center py-2 border-b border-slate-700/30">
          <div
            {...attributes}
            {...listeners}
            className="w-full px-2 py-2 flex justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 cursor-grab active:cursor-grabbing touch-none rounded-lg transition-colors"
            title="Drag to reorder column"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            title="Expand column"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Vertical title and count */}
        <div
          ref={setDroppableNodeRef}
          className="flex-1 flex flex-col items-center py-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
          onClick={onToggleCollapse}
        >
          {column.isDone && (
            <span
              className="mb-2 w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center"
              title="Done column"
            >
              <svg
                className="w-3 h-3 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
          )}
          <span className="px-2 py-1 bg-slate-700/50 rounded-full text-xs text-slate-400 mb-3">
            {column.cards.length}
          </span>
          <span
            className="text-white font-medium text-sm whitespace-nowrap"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
            }}
          >
            {column.name}
          </span>
        </div>
      </div>
    )
  }

  // Expanded view
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
          {/* Drag Handle - larger touch target with 6-dot grip icon */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 p-2 -ml-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 cursor-grab active:cursor-grabbing touch-none rounded-lg transition-colors"
            title="Drag to reorder column"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </div>

          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleUpdateName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateName()
                if (e.key === 'Escape') cancelEditing()
              }}
              className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              {column.isDone && (
                <span
                  className="flex-shrink-0 w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center"
                  title="Done column - time stops counting"
                >
                  <svg
                    className="w-3 h-3 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
              )}
              <h3
                onClick={startEditing}
                className="font-semibold text-white cursor-pointer hover:text-primary-300 transition-colors truncate"
              >
                {column.name}
              </h3>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 bg-slate-700/50 rounded-full text-xs text-slate-400">
            {column.cards.length}
          </span>
          <div className="relative">
            <button
              onClick={toggleMenu}
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
                <div className="fixed inset-0 z-10" onClick={closeMenu} />
                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 min-w-[160px]">
                  {onToggleCollapse && (
                    <button
                      onClick={() => {
                        onToggleCollapse()
                        closeMenu()
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Collapse
                    </button>
                  )}
                  <button
                    onClick={() => {
                      startEditing()
                      closeMenu()
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      handleToggleDone()
                      closeMenu()
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {column.isDone ? (
                      <>
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Unmark as Done
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Mark as Done
                      </>
                    )}
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
            <KanbanCard
              key={card.id}
              card={card}
              isDoneColumn={column.isDone}
              onClick={() => onCardClick(card)}
            />
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
                  closeAddCard()
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
                onClick={closeAddCard}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={openAddCard}
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
