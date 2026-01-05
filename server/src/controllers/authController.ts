import { Elysia, t } from 'elysia'
import { jwtPlugin, authPlugin } from '../middleware/auth'
import { authService } from '../services/AuthService'
import type { AuthResponse } from '../types'
import { AppError } from '../types'

export const authController = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)
  .get('/setup-status', () => {
    return {
      isSetupComplete: authService.isSetupComplete(),
    }
  })
  .post(
    '/register',
    async ({ body, jwt, set }) => {
      try {
        const { user } = await authService.register(
          body.username,
          body.password,
          body.displayName,
          body.inviteCode
        )

        const token = await jwt.sign({ sub: user.id.toString() })

        return {
          token,
          user: authService.toPublic(user),
        } as AuthResponse
      } catch (error) {
        if (error instanceof AppError) {
          set.status = 400
          return { error: { code: error.code, message: error.message } }
        }
        set.status = 500
        return { error: { code: 'UNKNOWN_ERROR', message: 'Registration failed' } }
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3 }),
        password: t.String({ minLength: 6 }),
        displayName: t.String({ minLength: 1 }),
        inviteCode: t.Optional(t.String()),
      }),
    }
  )
  .post(
    '/login',
    async ({ body, jwt, set }) => {
      try {
        const user = await authService.login(body.username, body.password)
        const token = await jwt.sign({ sub: user.id.toString() })

        return {
          token,
          user: authService.toPublic(user),
        } as AuthResponse
      } catch (error) {
        if (error instanceof AppError) {
          set.status = 401
          return { error: { code: error.code, message: error.message } }
        }
        set.status = 500
        return { error: { code: 'UNKNOWN_ERROR', message: 'Login failed' } }
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .use(authPlugin)
  .get('/me', ({ user }) => {
    return user
  })
