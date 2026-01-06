import { Elysia, t } from 'elysia'
import { authPlugin } from '../middleware/auth'
import { cardService } from '../services/CardService'
import { columnService } from '../services/ColumnService'
import { cardRepository } from '../repositories/CardRepository'
import { wsService } from '../services/WebSocketService'

export const cardController = new Elysia()
  .use(authPlugin)
  .post(
    '/columns/:columnId/cards',
    ({ params, body, user, set }) => {
      try {
        const card = cardService.createCard(parseInt(params.columnId), user!.id, body)
        const boardId = columnService.getBoardId(parseInt(params.columnId))
        if (boardId) {
          wsService.cardCreated(boardId, card)
        }
        return card
      } catch (error) {
        set.status = 403
        return { error: error instanceof Error ? error.message : 'Create failed' }
      }
    },
    {
      params: t.Object({
        columnId: t.String(),
      }),
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        dueDate: t.Optional(t.String()),
        priority: t.Optional(t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')])),
        color: t.Optional(t.String()),
        assigneeId: t.Optional(t.Number()),
        labelIds: t.Optional(t.Array(t.Number())),
        subtasks: t.Optional(
          t.Array(
            t.Object({
              id: t.String(),
              title: t.String(),
              completed: t.Boolean(),
            })
          )
        ),
        comments: t.Optional(
          t.Array(
            t.Object({
              id: t.String(),
              content: t.String(),
              authorId: t.Number(),
              authorName: t.String(),
              createdAt: t.String(),
              updatedAt: t.Optional(t.String()),
            })
          )
        ),
      }),
    }
  )
  .put(
    '/cards/:id',
    ({ params, body, user, set }) => {
      try {
        const card = cardService.updateCard(parseInt(params.id), user!.id, body)
        if (!card) {
          set.status = 404
          return { error: 'Card not found' }
        }
        const boardId = columnService.getBoardId(card.columnId)
        if (boardId) {
          wsService.cardUpdated(boardId, card)
        }
        return card
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
        title: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        dueDate: t.Optional(t.Union([t.String(), t.Null()])),
        priority: t.Optional(
          t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high'), t.Null()])
        ),
        color: t.Optional(t.Union([t.String(), t.Null()])),
        assigneeId: t.Optional(t.Union([t.Number(), t.Null()])),
        labelIds: t.Optional(t.Array(t.Number())),
        subtasks: t.Optional(
          t.Array(
            t.Object({
              id: t.String(),
              title: t.String(),
              completed: t.Boolean(),
            })
          )
        ),
        comments: t.Optional(
          t.Array(
            t.Object({
              id: t.String(),
              content: t.String(),
              authorId: t.Number(),
              authorName: t.String(),
              createdAt: t.String(),
              updatedAt: t.Optional(t.String()),
            })
          )
        ),
      }),
    }
  )
  .put(
    '/cards/:id/move',
    ({ params, body, user, set }) => {
      try {
        const card = cardService.moveCard(
          parseInt(params.id),
          user!.id,
          body.columnId,
          body.position
        )
        if (!card) {
          set.status = 404
          return { error: 'Card not found' }
        }
        const boardId = columnService.getBoardId(card.columnId)
        if (boardId) {
          wsService.cardMoved(boardId, {
            cardId: card.id,
            columnId: card.columnId,
            position: card.position,
            card,
          })
        }
        return card
      } catch (error) {
        set.status = 403
        return { error: error instanceof Error ? error.message : 'Move failed' }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        columnId: t.Number(),
        position: t.Number(),
      }),
    }
  )
  .delete(
    '/cards/:id',
    ({ params, user, set }) => {
      try {
        const columnId = cardRepository.getColumnId(parseInt(params.id))
        const boardId = columnId ? columnService.getBoardId(columnId) : null

        const deleted = cardService.deleteCard(parseInt(params.id), user!.id)
        if (!deleted) {
          set.status = 404
          return { error: 'Card not found' }
        }
        if (boardId) {
          wsService.cardDeleted(boardId, parseInt(params.id))
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
