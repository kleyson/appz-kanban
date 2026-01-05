import { userRepository } from '../repositories/UserRepository'
import { inviteService } from './InviteService'
import type { User, UserPublic } from '../types'
import { ErrorCode, AppError } from '../types'

export class AuthService {
  isSetupComplete(): boolean {
    return userRepository.hasAnyUsers()
  }

  async register(
    username: string,
    password: string,
    displayName: string,
    inviteCode?: string
  ): Promise<{ user: User; passwordHash: string }> {
    // Check if username already exists
    const existing = userRepository.findByUsername(username)
    if (existing) {
      throw new AppError(ErrorCode.USERNAME_TAKEN, 'Username already taken')
    }

    const isFirstUser = !this.isSetupComplete()
    let validatedInvite = null

    // If not the first user, require an invite code
    if (!isFirstUser) {
      if (!inviteCode) {
        throw new AppError(ErrorCode.REGISTRATION_DISABLED, 'Registration requires an invite code')
      }
      validatedInvite = inviteService.validateInvite(inviteCode)
    }

    // Hash password
    const passwordHash = await Bun.password.hash(password, {
      algorithm: 'bcrypt',
      cost: 10,
    })

    // Create user - first user becomes admin
    const role = isFirstUser ? 'admin' : 'user'
    const user = userRepository.create(username, passwordHash, displayName, role)

    // Mark invite as used
    if (validatedInvite) {
      inviteService.markInviteAsUsed(validatedInvite.id, user.id)
    }

    return { user, passwordHash }
  }

  async login(username: string, password: string): Promise<User> {
    const user = userRepository.findByUsername(username)
    if (!user) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid username or password')
    }

    const valid = await Bun.password.verify(password, user.passwordHash)
    if (!valid) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid username or password')
    }

    return user
  }

  toPublic(user: User): UserPublic {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    }
  }
}

export const authService = new AuthService()
