import { Elysia, t } from 'elysia'
import { authPlugin } from '../middleware/auth'
import { labelService } from '../services/LabelService'
import { labelRepository } from '../repositories/LabelRepository'
import { wsService } from '../services/WebSocketService'

export const labelController = new Elysia()
  .use(authPlugin)
  .get(
    '/boards/:id/labels',
    ({ params, user, set }) => {
      try {
        return labelService.getLabels(parseInt(params.id), user!.id)
      } catch (error) {
        set.status = 403
        return { error: error instanceof Error ? error.message : 'Access denied' }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .post(
    '/boards/:id/labels',
    ({ params, body, user, set }) => {
      try {
        const label = labelService.createLabel(parseInt(params.id), user!.id, body.name, body.color)
        wsService.labelCreated(parseInt(params.id), label)
        return label
      } catch (error) {
        set.status = 403
        return { error: error instanceof Error ? error.message : 'Create failed' }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.String({ minLength: 1 }),
        color: t.String(),
      }),
    }
  )
  .put(
    '/labels/:id',
    ({ params, body, user, set }) => {
      try {
        const label = labelService.updateLabel(parseInt(params.id), user!.id, body)
        if (!label) {
          set.status = 404
          return { error: 'Label not found' }
        }
        wsService.labelUpdated(label.boardId, label)
        return label
      } catch (error) {
        set.status = 403
        return { error: error instanceof Error ? error.message : 'Update failed' }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        color: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    '/labels/:id',
    ({ params, user, set }) => {
      try {
        const boardId = labelRepository.getBoardId(parseInt(params.id))

        const deleted = labelService.deleteLabel(parseInt(params.id), user!.id)
        if (!deleted) {
          set.status = 404
          return { error: 'Label not found' }
        }
        if (boardId) {
          wsService.labelDeleted(boardId, parseInt(params.id))
        }
        set.status = 204
        return
      } catch (error) {
        set.status = 403
        return { error: error instanceof Error ? error.message : 'Delete failed' }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
