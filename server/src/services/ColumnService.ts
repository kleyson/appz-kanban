import { columnRepository } from '../repositories/ColumnRepository'
import { boardRepository } from '../repositories/BoardRepository'
import { webhookService } from './WebhookService'
import type { Column } from '../types'

export class ColumnService {
  createColumn(boardId: number, userId: number, name: string): Column {
    // Check if user has access to board
    if (!boardRepository.isMember(boardId, userId)) {
      throw new Error('Access denied')
    }

    const column = columnRepository.create(boardId, name)

    // Send webhook
    webhookService.send(userId, 'column.created', {
      column,
      boardId,
    })

    return column
  }

  updateColumn(
    columnId: number,
    userId: number,
    data: { name?: string; isDone?: boolean }
  ): Column | null {
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

    const success = columnRepository.delete(columnId)

    // Send webhook
    if (success) {
      webhookService.send(userId, 'column.deleted', {
        columnId,
        boardId: column.boardId,
      })
    }

    return success
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
