import { inviteRepository } from '../repositories/InviteRepository'
import { userRepository } from '../repositories/UserRepository'
import type { Invite, InviteWithCreator } from '../types'
import { ErrorCode, AppError } from '../types'

const INVITE_EXPIRY_DAYS = 7

export class InviteService {
  createInvite(adminId: number): Invite {
    const admin = userRepository.findById(adminId)
    if (!admin || admin.role !== 'admin') {
      throw new AppError(ErrorCode.NOT_ADMIN, 'Only admins can create invites')
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS)

    return inviteRepository.create(adminId, expiresAt)
  }

  listPendingInvites(adminId: number): InviteWithCreator[] {
    const admin = userRepository.findById(adminId)
    if (!admin || admin.role !== 'admin') {
      throw new AppError(ErrorCode.NOT_ADMIN, 'Only admins can view invites')
    }

    return inviteRepository.findAllPending()
  }

  revokeInvite(adminId: number, inviteId: number): void {
    const admin = userRepository.findById(adminId)
    if (!admin || admin.role !== 'admin') {
      throw new AppError(ErrorCode.NOT_ADMIN, 'Only admins can revoke invites')
    }

    const invite = inviteRepository.findById(inviteId)
    if (!invite) {
      throw new AppError(ErrorCode.INVITE_NOT_FOUND, 'Invite not found')
    }

    inviteRepository.revoke(inviteId)
  }

  validateInvite(code: string): Invite {
    const invite = inviteRepository.findByCode(code)
    if (!invite) {
      throw new AppError(ErrorCode.INVALID_INVITE, 'Invalid invite code')
    }

    const validation = inviteRepository.isValid(invite)
    if (!validation.valid) {
      if (validation.reason === 'expired') {
        throw new AppError(ErrorCode.INVITE_EXPIRED, 'This invite has expired')
      }
      if (validation.reason === 'used') {
        throw new AppError(ErrorCode.INVITE_ALREADY_USED, 'This invite has already been used')
      }
    }

    return invite
  }

  markInviteAsUsed(inviteId: number, userId: number): void {
    inviteRepository.markAsUsed(inviteId, userId)
  }
}

export const inviteService = new InviteService()
