import { boardRepository } from '../repositories/BoardRepository'
import { columnRepository } from '../repositories/ColumnRepository'
import { cardRepository } from '../repositories/CardRepository'
import { labelRepository } from '../repositories/LabelRepository'
import type { Board, BoardWithDetails, ColumnWithCards } from '../types'

export class BoardService {
  getBoards(userId: number): Board[] {
    return boardRepository.findByUserId(userId)
  }

  getBoard(boardId: number, userId: number): BoardWithDetails | null {
    const board = boardRepository.findById(boardId)
    if (!board) return null

    // Check if user has access
    if (!boardRepository.isMember(boardId, userId)) {
      return null
    }

    // Get columns with cards
    const columns = columnRepository.findByBoardId(boardId)
    const columnsWithCards: ColumnWithCards[] = columns.map((col) => ({
      ...col,
      cards: cardRepository.findByColumnId(col.id),
    }))

    // Get members and labels
    const members = boardRepository.getMembers(boardId)
    const labels = labelRepository.findByBoardId(boardId)

    return {
      ...board,
      columns: columnsWithCards,
      members,
      labels,
    }
  }

  createBoard(name: string, userId: number): Board {
    return boardRepository.create(name, userId)
  }

  updateBoard(boardId: number, userId: number, data: { name?: string }): Board | null {
    // Check if user is owner
    if (!boardRepository.isOwner(boardId, userId)) {
      throw new Error('Only the owner can update the board')
    }

    return boardRepository.update(boardId, data)
  }

  deleteBoard(boardId: number, userId: number): boolean {
    // Check if user is owner
    if (!boardRepository.isOwner(boardId, userId)) {
      throw new Error('Only the owner can delete the board')
    }

    return boardRepository.delete(boardId)
  }

  addMember(boardId: number, userId: number, memberUserId: number): void {
    // Check if user is owner
    if (!boardRepository.isOwner(boardId, userId)) {
      throw new Error('Only the owner can add members')
    }

    boardRepository.addMember(boardId, memberUserId)
  }

  removeMember(boardId: number, userId: number, memberUserId: number): boolean {
    // Check if user is owner
    if (!boardRepository.isOwner(boardId, userId)) {
      throw new Error('Only the owner can remove members')
    }

    return boardRepository.removeMember(boardId, memberUserId)
  }

  isMember(boardId: number, userId: number): boolean {
    return boardRepository.isMember(boardId, userId)
  }
}

export const boardService = new BoardService()
