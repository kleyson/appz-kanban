import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useBoard, useMoveCard, useCreateColumn } from '../../api/hooks'
import { useBoardStore } from '../../stores/boardStore'
import { useWebSocket } from '../../api/websocket'
import { useFullscreen } from '../../hooks/useFullscreen'
import Column from './Column'
import KanbanCard from './KanbanCard'
import CardModal from './CardModal'
import FullscreenBoard from './FullscreenBoard'
import type { Card } from '../../types'

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const parsedBoardId = boardId ? parseInt(boardId) : undefined
  const { isLoading } = useBoard(parsedBoardId!)
  const currentBoard = useBoardStore((state) => state.currentBoard)
  const createColumn = useCreateColumn(parsedBoardId!)
  const { enterFullscreen, exitFullscreen } = useFullscreen()

  // Connect to WebSocket for real-time updates
  useWebSocket(parsedBoardId)
  const moveCard = useMoveCard()

  const [activeCard, setActiveCard] = useState<Card | null>(null)
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

  const cardMap = useMemo(() => {
    const map = new Map<number, Card>()
    currentBoard?.columns.forEach((col) => {
      col.cards.forEach((card) => map.set(card.id, card))
    })
    return map
  }, [currentBoard])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
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

    if (!over) return

    const cardId = active.id as number
    const card = cardMap.get(cardId)
    if (!card) return

    // Determine target column and position
    let targetColumnId: number
    let targetPosition: number

    // Check if dropping on a column
    const overIdStr = over.id.toString()
    if (overIdStr.startsWith('column-')) {
      targetColumnId = parseInt(overIdStr.replace('column-', ''))
      const targetColumn = currentBoard?.columns.find((c) => c.id === targetColumnId)
      targetPosition = targetColumn?.cards.length ?? 0
    } else {
      // Dropping on a card
      const overCard = cardMap.get(over.id as number)
      if (!overCard) return
      targetColumnId = overCard.columnId
      targetPosition = overCard.position
    }

    // Only move if something changed
    if (card.columnId === targetColumnId && card.position === targetPosition) {
      return
    }

    try {
      await moveCard.mutateAsync({
        cardId,
        data: {
          columnId: targetColumnId,
          position: targetPosition,
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
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
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

          {/* Settings button */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Members avatars */}
          <div className="flex -space-x-2">
            {currentBoard.members.slice(0, 4).map((member) => (
              <div
                key={member.userId}
                className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium ring-2 ring-slate-900"
                title={member.user?.displayName}
              >
                {member.user?.displayName?.charAt(0).toUpperCase()}
              </div>
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
            {currentBoard.columns.map((column) => (
              <Column key={column.id} column={column} onCardClick={setSelectedCard} />
            ))}

            {/* Add Column */}
            <div className="w-80 flex-shrink-0">
              {showAddColumn ? (
                <form
                  onSubmit={handleAddColumn}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
                >
                  <input
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
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 mb-3"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!newColumnName.trim()}
                      className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddColumn(false)
                        setNewColumnName('')
                      }}
                      className="px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
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
