import { Elysia, t } from 'elysia'
import { authPlugin } from '../middleware/auth'
import { columnService } from '../services/ColumnService'
import { wsService } from '../services/WebSocketService'

export const columnController = new Elysia()
  .use(authPlugin)
  .post(
    '/boards/:id/columns',
    ({ params, body, user, set }) => {
      try {
        const column = columnService.createColumn(parseInt(params.id), user!.id, body.name)
        wsService.columnCreated(parseInt(params.id), column)
        return column
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
      }),
    }
  )
  .put(
    '/columns/:id',
    ({ params, body, user, set }) => {
      try {
        const column = columnService.updateColumn(parseInt(params.id), user!.id, body)
        if (!column) {
          set.status = 404
          return { error: 'Column not found' }
        }
        const boardId = columnService.getBoardId(parseInt(params.id))
        if (boardId) {
          wsService.columnUpdated(boardId, column)
        }
        return column
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
      }),
    }
  )
  .delete(
    '/columns/:id',
    ({ params, user, set }) => {
      try {
        const boardId = columnService.getBoardId(parseInt(params.id))
        const deleted = columnService.deleteColumn(parseInt(params.id), user!.id)
        if (!deleted) {
          set.status = 404
          return { error: 'Column not found' }
        }
        if (boardId) {
          wsService.columnDeleted(boardId, parseInt(params.id))
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
  .put(
    '/boards/:id/columns/reorder',
    ({ params, body, user, set }) => {
      try {
        columnService.reorderColumns(parseInt(params.id), user!.id, body.columnIds)
        wsService.broadcast(parseInt(params.id), {
          type: 'column:reordered',
          boardId: parseInt(params.id),
          payload: { columnIds: body.columnIds },
        })
        return { success: true }
      } catch (error) {
        set.status = 403
        return { error: error instanceof Error ? error.message : 'Reorder failed' }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        columnIds: t.Array(t.Number()),
      }),
    }
  )
