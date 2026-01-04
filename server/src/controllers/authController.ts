import { Elysia, t } from 'elysia'
import { jwtPlugin, authPlugin } from '../middleware/auth'
import { authService } from '../services/AuthService'
import type { AuthResponse } from '../types'

export const authController = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)
  .post(
    '/register',
    async ({ body, jwt }) => {
      try {
        const { user } = await authService.register(body.username, body.password, body.displayName)

        const token = await jwt.sign({ sub: user.id.toString() })

        return {
          token,
          user: authService.toPublic(user),
        } as AuthResponse
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Registration failed')
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3 }),
        password: t.String({ minLength: 6 }),
        displayName: t.String({ minLength: 1 }),
      }),
    }
  )
  .post(
    '/login',
    async ({ body, jwt }) => {
      try {
        const user = await authService.login(body.username, body.password)
        const token = await jwt.sign({ sub: user.id.toString() })

        return {
          token,
          user: authService.toPublic(user),
        } as AuthResponse
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Login failed')
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
