import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { userRepository } from '../repositories/UserRepository'
import type { UserPublic } from '../types'

const jwtSecret = process.env.JWT_SECRET || 'kanban-secret-key-change-in-production'

// Access token expires in 60 minutes
const ACCESS_TOKEN_EXPIRY = '60m'

// JWT plugin for signing tokens (used in login/register)
export const jwtPlugin = new Elysia({ name: 'jwt' }).use(
  jwt({
    name: 'jwt',
    secret: jwtSecret,
    exp: ACCESS_TOKEN_EXPIRY,
  })
)

// Helper function to extract user from token
async function getUserFromToken(
  jwtVerify: (token: string) => Promise<{ sub?: string } | false>,
  authorization: string | null
): Promise<UserPublic | null> {
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  const token = authorization.slice(7)

  try {
    const payload = await jwtVerify(token)

    if (!payload || typeof payload.sub !== 'string') {
      return null
    }

    const userId = parseInt(payload.sub)
    const user = userRepository.findPublicById(userId)
    return user
  } catch {
    return null
  }
}

// Auth plugin that derives user from token and guards routes
export const authPlugin = new Elysia({ name: 'auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: jwtSecret,
      exp: ACCESS_TOKEN_EXPIRY,
    })
  )
  .derive({ as: 'scoped' }, async ({ jwt, headers }): Promise<{ user: UserPublic | null }> => {
    const user = await getUserFromToken((token) => jwt.verify(token), headers.authorization ?? null)
    return { user }
  })
  .onBeforeHandle({ as: 'scoped' }, ({ user, set }) => {
    if (!user) {
      set.status = 401
      return { error: 'Unauthorized' }
    }
  })
