import { useState, useMemo, useCallback } from 'react'
import { type DragStartEvent, type DragEndEvent, type DragOverEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useMoveCard, useReorderColumns } from '../api/hooks'
import { buildCardMap, parseDragDropTarget, isMoveNecessary } from '../components/board/helpers'
import type { Card, ColumnWithCards, BoardWithDetails } from '../types'

interface UseBoardDragDropProps {
  boardId: number
  board: BoardWithDetails | null
}

interface UseBoardDragDropReturn {
  activeCard: Card | null
  activeColumn: ColumnWithCards | null
  columnIds: string[]
  cardMap: Map<number, Card>
  handleDragStart: (event: DragStartEvent) => void
  handleDragOver: (event: DragOverEvent) => void
  handleDragEnd: (event: DragEndEvent) => Promise<void>
}

export function useBoardDragDrop({
  boardId,
  board,
}: UseBoardDragDropProps): UseBoardDragDropReturn {
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeColumn, setActiveColumn] = useState<ColumnWithCards | null>(null)

  const moveCard = useMoveCard()
  const reorderColumns = useReorderColumns(boardId)

  const cardMap = useMemo(() => buildCardMap(board?.columns || []), [board])

  const columnIds = useMemo(() => board?.columns.map((col) => `column-${col.id}`) ?? [], [board])

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const activeIdStr = active.id.toString()

      // Check if dragging a column
      if (activeIdStr.startsWith('column-')) {
        const columnId = parseInt(activeIdStr.replace('column-', ''))
        const column = board?.columns.find((c) => c.id === columnId)
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
    },
    [board, cardMap]
  )

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Handle drag over for visual feedback if needed
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveCard(null)
      setActiveColumn(null)

      if (!over || !board) return

      const activeIdStr = active.id.toString()
      const overIdStr = over.id.toString()

      // Handle column reordering
      if (activeIdStr.startsWith('column-') && overIdStr.startsWith('column-')) {
        const activeColumnId = parseInt(activeIdStr.replace('column-', ''))
        const overColumnId = parseInt(overIdStr.replace('column-', ''))

        if (activeColumnId !== overColumnId) {
          const oldIndex = board.columns.findIndex((c) => c.id === activeColumnId)
          const newIndex = board.columns.findIndex((c) => c.id === overColumnId)

          if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(board.columns, oldIndex, newIndex)
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
      const target = parseDragDropTarget(over.id, cardMap, board.columns)
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
    },
    [board, cardMap, moveCard, reorderColumns]
  )

  return {
    activeCard,
    activeColumn,
    columnIds,
    cardMap,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  }
}
