import { userRepository } from '../repositories/UserRepository'
import type { User, UserPublic } from '../types'

export class AuthService {
  async register(
    username: string,
    password: string,
    displayName: string
  ): Promise<{ user: User; passwordHash: string }> {
    // Check if username already exists
    const existing = userRepository.findByUsername(username)
    if (existing) {
      throw new Error('Username already taken')
    }

    // Hash password
    const passwordHash = await Bun.password.hash(password, {
      algorithm: 'bcrypt',
      cost: 10,
    })

    // Create user
    const user = userRepository.create(username, passwordHash, displayName)

    return { user, passwordHash }
  }

  async login(username: string, password: string): Promise<User> {
    const user = userRepository.findByUsername(username)
    if (!user) {
      throw new Error('Invalid username or password')
    }

    const valid = await Bun.password.verify(password, user.passwordHash)
    if (!valid) {
      throw new Error('Invalid username or password')
    }

    return user
  }

  toPublic(user: User): UserPublic {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    }
  }
}

export const authService = new AuthService()
