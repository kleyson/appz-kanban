import { Elysia, t } from 'elysia'
import { authPlugin } from '../middleware/auth'
import { boardService } from '../services/BoardService'
import { userRepository } from '../repositories/UserRepository'

export const boardController = new Elysia({ prefix: '/boards' })
  .use(authPlugin)
  .get('/', ({ user }) => {
    return boardService.getBoards(user!.id)
  })
  .get(
    '/:id',
    ({ params, user, set }) => {
      const board = boardService.getBoard(parseInt(params.id), user!.id)
      if (!board) {
        set.status = 404
        return { error: 'Board not found' }
      }
      return board
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .post(
    '/',
    ({ body, user }) => {
      return boardService.createBoard(body.name, user!.id)
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
      }),
    }
  )
  .put(
    '/:id',
    ({ params, body, user, set }) => {
      try {
        const board = boardService.updateBoard(parseInt(params.id), user!.id, body)
        if (!board) {
          set.status = 404
          return { error: 'Board not found' }
        }
        return board
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
    '/:id',
    ({ params, user, set }) => {
      try {
        const deleted = boardService.deleteBoard(parseInt(params.id), user!.id)
        if (!deleted) {
          set.status = 404
          return { error: 'Board not found' }
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
  .post(
    '/:id/members',
    ({ params, body, user, set }) => {
      try {
        const memberUser = userRepository.findByUsername(body.username)
        if (!memberUser) {
          set.status = 404
          return { error: 'User not found' }
        }

        boardService.addMember(parseInt(params.id), user!.id, memberUser.id)
        return { success: true }
      } catch (error) {
        set.status = 403
        return { error: error instanceof Error ? error.message : 'Add member failed' }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        username: t.String(),
      }),
    }
  )
  .delete(
    '/:id/members/:userId',
    ({ params, user, set }) => {
      try {
        const removed = boardService.removeMember(
          parseInt(params.id),
          user!.id,
          parseInt(params.userId)
        )
        if (!removed) {
          set.status = 404
          return { error: 'Member not found' }
        }
        set.status = 204
        return
      } catch (error) {
        set.status = 403
        return { error: error instanceof Error ? error.message : 'Remove member failed' }
      }
    },
    {
      params: t.Object({
        id: t.String(),
        userId: t.String(),
      }),
    }
  )
