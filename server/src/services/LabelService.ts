import { labelRepository } from '../repositories/LabelRepository'
import { boardRepository } from '../repositories/BoardRepository'
import { webhookService } from './WebhookService'
import type { Label } from '../types'

export class LabelService {
  getLabels(boardId: number, userId: number): Label[] {
    // Check if user has access
    if (!boardRepository.isMember(boardId, userId)) {
      throw new Error('Access denied')
    }

    return labelRepository.findByBoardId(boardId)
  }

  createLabel(boardId: number, userId: number, name: string, color: string): Label {
    // Check if user has access
    if (!boardRepository.isMember(boardId, userId)) {
      throw new Error('Access denied')
    }

    const label = labelRepository.create(boardId, name, color)

    // Send webhook
    webhookService.send(userId, 'label.created', {
      label,
      boardId,
    })

    return label
  }

  updateLabel(
    labelId: number,
    userId: number,
    data: { name?: string; color?: string }
  ): Label | null {
    const label = labelRepository.findById(labelId)
    if (!label) return null

    // Check if user has access
    if (!boardRepository.isMember(label.boardId, userId)) {
      throw new Error('Access denied')
    }

    return labelRepository.update(labelId, data)
  }

  deleteLabel(labelId: number, userId: number): boolean {
    const label = labelRepository.findById(labelId)
    if (!label) return false

    // Check if user has access
    if (!boardRepository.isMember(label.boardId, userId)) {
      throw new Error('Access denied')
    }

    return labelRepository.delete(labelId)
  }
}

export const labelService = new LabelService()
