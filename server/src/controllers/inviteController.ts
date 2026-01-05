import { Elysia } from 'elysia'
import { authPlugin } from '../middleware/auth'
import { inviteService } from '../services/InviteService'
import { AppError, ErrorCode } from '../types'

export const inviteController = new Elysia({ prefix: '/invites' })
  .use(authPlugin)
  .get('/', ({ user, set }) => {
    try {
      if (!user || user.role !== 'admin') {
        set.status = 403
        return { error: { code: ErrorCode.NOT_ADMIN, message: 'Admin access required' } }
      }

      const invites = inviteService.listPendingInvites(user.id)
      return { invites }
    } catch (error) {
      if (error instanceof AppError) {
        set.status = 403
        return { error: { code: error.code, message: error.message } }
      }
      set.status = 500
      return { error: { code: 'UNKNOWN_ERROR', message: 'Failed to list invites' } }
    }
  })
  .post('/', ({ user, set }) => {
    try {
      if (!user || user.role !== 'admin') {
        set.status = 403
        return { error: { code: ErrorCode.NOT_ADMIN, message: 'Admin access required' } }
      }

      const invite = inviteService.createInvite(user.id)
      return { invite }
    } catch (error) {
      if (error instanceof AppError) {
        set.status = 403
        return { error: { code: error.code, message: error.message } }
      }
      set.status = 500
      return { error: { code: 'UNKNOWN_ERROR', message: 'Failed to create invite' } }
    }
  })
  .delete('/:id', ({ user, params, set }) => {
    try {
      if (!user || user.role !== 'admin') {
        set.status = 403
        return { error: { code: ErrorCode.NOT_ADMIN, message: 'Admin access required' } }
      }

      inviteService.revokeInvite(user.id, parseInt(params.id))
      return { success: true }
    } catch (error) {
      if (error instanceof AppError) {
        set.status = error.code === ErrorCode.INVITE_NOT_FOUND ? 404 : 403
        return { error: { code: error.code, message: error.message } }
      }
      set.status = 500
      return { error: { code: 'UNKNOWN_ERROR', message: 'Failed to revoke invite' } }
    }
  })
