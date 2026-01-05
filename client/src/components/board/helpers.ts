import type { RotLevel, Card, ColumnWithCards } from '../../types'

/**
 * Priority configuration for display styling
 */
export const priorityConfig = {
  low: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Low' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Med' },
  high: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'High' },
}

/**
 * Get progress bar color based on completion percentage
 */
export function getProgressColor(progressPercent: number): string {
  if (progressPercent === 100) return 'bg-emerald-500'
  if (progressPercent >= 75) return 'bg-primary-500'
  if (progressPercent >= 50) return 'bg-amber-500'
  return 'bg-slate-500'
}

/**
 * Generate mold spot data for rot effect visualization
 */
export interface MoldSpot {
  id: number
  size: number
  top: number
  left: number
  opacity: number
}

export function generateMoldSpots(spots: number, opacity: number): MoldSpot[] {
  if (spots === 0) return []

  const result: MoldSpot[] = []
  for (let i = 0; i < spots; i++) {
    result.push({
      id: i,
      size: 4 + Math.random() * 8,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity,
    })
  }
  return result
}

/**
 * Calculate subtask progress
 */
export interface SubtaskProgress {
  completed: number
  total: number
  percent: number
}

export function calculateSubtaskProgress(subtasks: { completed: boolean }[]): SubtaskProgress {
  const total = subtasks.length
  const completed = subtasks.filter((s) => s.completed).length
  const percent = total > 0 ? (completed / total) * 100 : 0
  return { completed, total, percent }
}

/**
 * Build a map of card IDs to cards for quick lookup
 */
export function buildCardMap(columns: ColumnWithCards[]): Map<number, Card> {
  const map = new Map<number, Card>()
  columns.forEach((col) => {
    col.cards.forEach((card) => map.set(card.id, card))
  })
  return map
}

/**
 * Result of parsing a drag-and-drop target
 */
export interface DragDropTarget {
  columnId: number
  position: number
}

/**
 * Parse the drop target from a drag-and-drop event
 */
export function parseDragDropTarget(
  overId: string | number,
  cardMap: Map<number, Card>,
  columns: ColumnWithCards[]
): DragDropTarget | null {
  const overIdStr = overId.toString()

  // Check if dropping on a column
  if (overIdStr.startsWith('column-')) {
    const columnId = parseInt(overIdStr.replace('column-', ''))
    const targetColumn = columns.find((c) => c.id === columnId)
    return {
      columnId,
      position: targetColumn?.cards.length ?? 0,
    }
  }

  // Dropping on a card
  const overCard = cardMap.get(overId as number)
  if (!overCard) return null

  return {
    columnId: overCard.columnId,
    position: overCard.position,
  }
}

/**
 * Check if a card move is necessary (different position or column)
 */
export function isMoveNecessary(
  card: Card,
  targetColumnId: number,
  targetPosition: number
): boolean {
  return card.columnId !== targetColumnId || card.position !== targetPosition
}
