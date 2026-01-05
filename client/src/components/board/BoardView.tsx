import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useBoard, useMoveCard, useCreateColumn, useReorderColumns } from '../../api/hooks'
import { useBoardStore } from '../../stores/boardStore'
import { useWebSocket } from '../../api/websocket'
import { useFullscreen } from '../../hooks/useFullscreen'
import { LoadingSpinner, Avatar, Input, Button } from '../ui'
import Column from './Column'
import KanbanCard from './KanbanCard'
import CardModal from './CardModal'
import FullscreenBoard from './FullscreenBoard'
import { buildCardMap, parseDragDropTarget, isMoveNecessary } from './helpers'
import type { Card, ColumnWithCards } from '../../types'

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>()
  const parsedBoardId = boardId ? parseInt(boardId) : undefined
  const { isLoading } = useBoard(parsedBoardId!)
  const currentBoard = useBoardStore((state) => state.currentBoard)
  const createColumn = useCreateColumn(parsedBoardId!)
  const { enterFullscreen, exitFullscreen } = useFullscreen()

  // Connect to WebSocket for real-time updates
  useWebSocket(parsedBoardId)
  const moveCard = useMoveCard()
  const reorderColumns = useReorderColumns(parsedBoardId!)

  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeColumn, setActiveColumn] = useState<ColumnWithCards | null>(null)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [showFullscreen, setShowFullscreen] = useState(false)

  const handleEnterFullscreen = () => {
    setShowFullscreen(true)
    enterFullscreen()
  }

  const handleExitFullscreen = () => {
    setShowFullscreen(false)
    exitFullscreen()
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const cardMap = useMemo(
    () => buildCardMap(currentBoard?.columns || []),
    [currentBoard]
  )

  const columnIds = useMemo(
    () => currentBoard?.columns.map((col) => `column-${col.id}`) ?? [],
    [currentBoard]
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeIdStr = active.id.toString()

    // Check if dragging a column
    if (activeIdStr.startsWith('column-')) {
      const columnId = parseInt(activeIdStr.replace('column-', ''))
      const column = currentBoard?.columns.find((c) => c.id === columnId)
      if (column) {
        setActiveColumn(column)
        return
      }
    }

    // Otherwise, it's a card
    const card = cardMap.get(active.id as number)
    if (card) {
      setActiveCard(card)
    }
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Handle drag over for visual feedback
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)
    setActiveColumn(null)

    if (!over || !currentBoard) return

    const activeIdStr = active.id.toString()
    const overIdStr = over.id.toString()

    // Handle column reordering
    if (activeIdStr.startsWith('column-') && overIdStr.startsWith('column-')) {
      const activeColumnId = parseInt(activeIdStr.replace('column-', ''))
      const overColumnId = parseInt(overIdStr.replace('column-', ''))

      if (activeColumnId !== overColumnId) {
        const oldIndex = currentBoard.columns.findIndex((c) => c.id === activeColumnId)
        const newIndex = currentBoard.columns.findIndex((c) => c.id === overColumnId)

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(currentBoard.columns, oldIndex, newIndex)
          const newColumnIds = newOrder.map((c) => c.id)
          try {
            await reorderColumns.mutateAsync(newColumnIds)
          } catch (error) {
            console.error('Failed to reorder columns:', error)
          }
        }
      }
      return
    }

    // Handle card movement
    const cardId = active.id as number
    const card = cardMap.get(cardId)
    if (!card) return

    // Parse the drop target
    const target = parseDragDropTarget(over.id, cardMap, currentBoard.columns)
    if (!target) return

    // Only move if something changed
    if (!isMoveNecessary(card, target.columnId, target.position)) {
      return
    }

    try {
      await moveCard.mutateAsync({
        cardId,
        data: {
          columnId: target.columnId,
          position: target.position,
        },
      })
    } catch (error) {
      console.error('Failed to move card:', error)
    }
  }

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColumnName.trim()) return

    try {
      await createColumn.mutateAsync({ name: newColumnName.trim() })
      setNewColumnName('')
      setShowAddColumn(false)
    } catch (error) {
      console.error('Failed to create column:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Board not found</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Fullscreen View */}
      {showFullscreen && parsedBoardId && (
        <FullscreenBoard boardId={parsedBoardId} onExit={handleExitFullscreen} />
      )}

      {/* Board Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <h1 className="text-xl font-bold text-white">{currentBoard.name}</h1>
        <div className="flex items-center gap-3">
          {/* Fullscreen button */}
          <button
            onClick={handleEnterFullscreen}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            title="Enter fullscreen mode"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>

          {/* Members avatars */}
          <div className="flex -space-x-2">
            {currentBoard.members.slice(0, 4).map((member) => (
              <Avatar
                key={member.userId}
                name={member.user?.displayName || ''}
                size="md"
                className="ring-2 ring-slate-900"
              />
            ))}
            {currentBoard.members.length > 4 && (
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 text-xs font-medium ring-2 ring-slate-900">
                +{currentBoard.members.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden touch-pan-x">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-6 h-full min-w-max">
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {currentBoard.columns.map((column) => (
                <Column key={column.id} column={column} onCardClick={setSelectedCard} />
              ))}
            </SortableContext>

            {/* Add Column */}
            <div className="w-80 flex-shrink-0">
              {showAddColumn ? (
                <form
                  onSubmit={handleAddColumn}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
                >
                  <Input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newColumnName.trim()) {
                        handleAddColumn(e)
                      }
                      if (e.key === 'Escape') {
                        setShowAddColumn(false)
                        setNewColumnName('')
                      }
                    }}
                    placeholder="Column name (Enter to save)"
                    className="mb-3"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={!newColumnName.trim()}
                      variant="primary"
                      size="md"
                      className="flex-1"
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowAddColumn(false)
                        setNewColumnName('')
                      }}
                      variant="ghost"
                      size="md"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddColumn(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-slate-800/30 hover:bg-slate-800/50 border border-dashed border-slate-600/50 hover:border-slate-500/50 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Column
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeCard ? <KanbanCard card={activeCard} isDragging /> : null}
            {activeColumn ? (
              <div className="w-80 opacity-80">
                <Column column={activeColumn} onCardClick={() => {}} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardId={currentBoard.id}
          labels={currentBoard.labels}
          members={currentBoard.members}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  )
}
