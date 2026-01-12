import { cardRepository } from '../repositories/CardRepository'
import { columnRepository } from '../repositories/ColumnRepository'
import { boardRepository } from '../repositories/BoardRepository'
import { settingsRepository } from '../repositories/SettingsRepository'
import { webhookService } from './WebhookService'
import type { Card, Priority, Subtask, Comment } from '../types'

export class CardService {
  createCard(
    columnId: number,
    userId: number,
    data: {
      title: string
      description?: string
      dueDate?: string
      priority?: Priority
      color?: string
      assigneeId?: number
      labelIds?: number[]
      subtasks?: Subtask[]
      comments?: Comment[]
    }
  ): Card {
    // Check if user has access to the column's board
    const boardId = columnRepository.getBoardId(columnId)
    if (!boardId || !boardRepository.isMember(boardId, userId)) {
      throw new Error('Access denied')
    }

    // Apply default due date from settings if not provided
    let cardData = { ...data }
    if (!cardData.dueDate) {
      const settings = settingsRepository.findByUserId(userId)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + settings.defaultDueDays)
      cardData.dueDate = dueDate.toISOString()
    }

    const card = cardRepository.create(columnId, cardData)

    // Send webhook
    webhookService.send(userId, 'card.created', {
      card,
      boardId,
      columnId,
    })

    return card
  }

  updateCard(
    cardId: number,
    userId: number,
    data: {
      title?: string
      description?: string | null
      dueDate?: string | null
      priority?: Priority | null
      color?: string | null
      assigneeId?: number | null
      labelIds?: number[]
      subtasks?: Subtask[]
      comments?: Comment[]
    }
  ): Card | null {
    // Check if user has access
    const columnId = cardRepository.getColumnId(cardId)
    if (!columnId) return null

    const boardId = columnRepository.getBoardId(columnId)
    if (!boardId || !boardRepository.isMember(boardId, userId)) {
      throw new Error('Access denied')
    }

    const card = cardRepository.update(cardId, data)

    // Send webhook
    if (card) {
      webhookService.send(userId, 'card.updated', {
        card,
        boardId,
        columnId,
        changes: data,
      })
    }

    return card
  }

  deleteCard(cardId: number, userId: number): boolean {
    // Check if user has access
    const columnId = cardRepository.getColumnId(cardId)
    if (!columnId) return false

    const boardId = columnRepository.getBoardId(columnId)
    if (!boardId || !boardRepository.isMember(boardId, userId)) {
      throw new Error('Access denied')
    }

    const success = cardRepository.delete(cardId)

    // Send webhook
    if (success) {
      webhookService.send(userId, 'card.deleted', {
        cardId,
        boardId,
        columnId,
      })
    }

    return success
  }

  moveCard(cardId: number, userId: number, toColumnId: number, toPosition: number): Card | null {
    // Check if user has access to source card
    const sourceColumnId = cardRepository.getColumnId(cardId)
    if (!sourceColumnId) return null

    const sourceBoardId = columnRepository.getBoardId(sourceColumnId)
    if (!sourceBoardId || !boardRepository.isMember(sourceBoardId, userId)) {
      throw new Error('Access denied')
    }

    // Check if target column is in the same board
    const targetBoardId = columnRepository.getBoardId(toColumnId)
    if (targetBoardId !== sourceBoardId) {
      throw new Error('Cannot move card to a different board')
    }

    const card = cardRepository.move(cardId, toColumnId, toPosition)

    // Send webhook
    if (card) {
      webhookService.send(userId, 'card.moved', {
        card,
        boardId: sourceBoardId,
        fromColumnId: sourceColumnId,
        toColumnId,
        toPosition,
      })
    }

    return card
  }

  archiveCard(cardId: number, userId: number): Card | null {
    // Check if user has access
    const columnId = cardRepository.getColumnId(cardId)
    if (!columnId) return null

    const boardId = columnRepository.getBoardId(columnId)
    if (!boardId || !boardRepository.isMember(boardId, userId)) {
      throw new Error('Access denied')
    }

    const card = cardRepository.archive(cardId)

    // Send webhook
    if (card) {
      webhookService.send(userId, 'card.archived', {
        card,
        boardId,
        columnId,
      })
    }

    return card
  }

  unarchiveCard(cardId: number, userId: number, toColumnId: number): Card | null {
    // Check if user has access
    const card = cardRepository.findById(cardId)
    if (!card) return null

    const boardId = columnRepository.getBoardId(card.columnId)
    if (!boardId || !boardRepository.isMember(boardId, userId)) {
      throw new Error('Access denied')
    }

    // Check if target column is in the same board
    const targetBoardId = columnRepository.getBoardId(toColumnId)
    if (targetBoardId !== boardId) {
      throw new Error('Cannot unarchive card to a different board')
    }

    const unarchivedCard = cardRepository.unarchive(cardId, toColumnId)

    // Send webhook
    if (unarchivedCard) {
      webhookService.send(userId, 'card.unarchived', {
        card: unarchivedCard,
        boardId,
        toColumnId,
      })
    }

    return unarchivedCard
  }

  getArchivedCards(boardId: number, userId: number): Card[] {
    // Check if user has access
    if (!boardRepository.isMember(boardId, userId)) {
      throw new Error('Access denied')
    }

    // Get all column IDs for this board
    const columns = columnRepository.findByBoardId(boardId)
    const columnIds = columns.map((c) => c.id)

    return cardRepository.findArchivedByBoardId(boardId, columnIds)
  }
}

export const cardService = new CardService()
