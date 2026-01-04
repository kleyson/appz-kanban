import { columnRepository } from '../repositories/ColumnRepository'
import { boardRepository } from '../repositories/BoardRepository'
import type { Column } from '../types'

export class ColumnService {
  createColumn(boardId: number, userId: number, name: string): Column {
    // Check if user has access to board
    if (!boardRepository.isMember(boardId, userId)) {
      throw new Error('Access denied')
    }

    return columnRepository.create(boardId, name)
  }

  updateColumn(columnId: number, userId: number, data: { name?: string }): Column | null {
    const column = columnRepository.findById(columnId)
    if (!column) return null

    // Check if user has access to board
    if (!boardRepository.isMember(column.boardId, userId)) {
      throw new Error('Access denied')
    }

    return columnRepository.update(columnId, data)
  }

  deleteColumn(columnId: number, userId: number): boolean {
    const column = columnRepository.findById(columnId)
    if (!column) return false

    // Check if user has access to board
    if (!boardRepository.isMember(column.boardId, userId)) {
      throw new Error('Access denied')
    }

    return columnRepository.delete(columnId)
  }

  reorderColumns(boardId: number, userId: number, columnIds: number[]): void {
    // Check if user has access to board
    if (!boardRepository.isMember(boardId, userId)) {
      throw new Error('Access denied')
    }

    columnRepository.reorder(boardId, columnIds)
  }

  getBoardId(columnId: number): number | null {
    return columnRepository.getBoardId(columnId)
  }
}

export const columnService = new ColumnService()
