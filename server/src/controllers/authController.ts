import { Elysia, t } from 'elysia'
import { jwtPlugin, authPlugin } from '../middleware/auth'
import { authService } from '../services/AuthService'
import { refreshTokenRepository } from '../repositories/RefreshTokenRepository'
import { userRepository } from '../repositories/UserRepository'
import type { AuthResponse } from '../types'
import { AppError } from '../types'

// Cookie configuration for refresh token
const REFRESH_COOKIE_NAME = 'refresh_token'
const isProduction = process.env.NODE_ENV === 'production'

// Type for Elysia's cookie object
type ElysiaCookie = Record<string, { value: string; set: (options: CookieOptions) => void }>
interface CookieOptions {
  value: string
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
  path?: string
}

function setRefreshCookie(cookie: ElysiaCookie, token: string) {
  cookie[REFRESH_COOKIE_NAME].set({
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/api/auth',
  })
}

function clearRefreshCookie(cookie: ElysiaCookie) {
  cookie[REFRESH_COOKIE_NAME].set({
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 0,
    path: '/api/auth',
  })
}

export const authController = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)
  .get('/setup-status', () => {
    return {
      isSetupComplete: authService.isSetupComplete(),
    }
  })
  .post(
    '/register',
    async ({ body, jwt, set, cookie }) => {
      try {
        const { user } = await authService.register(
          body.username,
          body.password,
          body.displayName,
          body.inviteCode
        )

        const token = await jwt.sign({ sub: user.id.toString() })

        // Create refresh token and set as HTTP-only cookie
        const refreshToken = refreshTokenRepository.create(user.id)
        setRefreshCookie(cookie as ElysiaCookie, refreshToken.token)

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
    async ({ body, jwt, set, cookie }) => {
      try {
        const user = await authService.login(body.username, body.password)
        const token = await jwt.sign({ sub: user.id.toString() })

        // Create refresh token and set as HTTP-only cookie
        const refreshToken = refreshTokenRepository.create(user.id)
        setRefreshCookie(cookie as ElysiaCookie, refreshToken.token)

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
  .post('/refresh', async ({ jwt, set, cookie }) => {
    try {
      const refreshTokenValue = String(cookie[REFRESH_COOKIE_NAME]?.value || '')

      if (!refreshTokenValue) {
        set.status = 401
        return { error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided' } }
      }

      // Find valid refresh token
      const storedToken = refreshTokenRepository.findValidByToken(refreshTokenValue)
      if (!storedToken) {
        clearRefreshCookie(cookie as ElysiaCookie)
        set.status = 401
        return {
          error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' },
        }
      }

      // Get user
      const user = userRepository.findPublicById(storedToken.userId)
      if (!user) {
        refreshTokenRepository.delete(refreshTokenValue)
        clearRefreshCookie(cookie as ElysiaCookie)
        set.status = 401
        return { error: { code: 'USER_NOT_FOUND', message: 'User not found' } }
      }

      // Generate new access token
      const accessToken = await jwt.sign({ sub: user.id.toString() })

      // Rotate refresh token (delete old, create new)
      const newRefreshToken = refreshTokenRepository.rotateToken(refreshTokenValue, user.id)
      if (newRefreshToken) {
        setRefreshCookie(cookie as ElysiaCookie, newRefreshToken.token)
      }

      return {
        token: accessToken,
        user,
      } as AuthResponse
    } catch {
      set.status = 500
      return { error: { code: 'REFRESH_FAILED', message: 'Token refresh failed' } }
    }
  })
  .post('/logout', ({ set, cookie }) => {
    try {
      const refreshTokenValue = String(cookie[REFRESH_COOKIE_NAME]?.value || '')

      if (refreshTokenValue) {
        // Delete the refresh token from database
        refreshTokenRepository.delete(refreshTokenValue)
      }

      // Clear the cookie
      clearRefreshCookie(cookie as ElysiaCookie)

      set.status = 204
      return
    } catch {
      set.status = 500
      return { error: { code: 'LOGOUT_FAILED', message: 'Logout failed' } }
    }
  })
  .use(authPlugin)
  .get('/me', ({ user }) => {
    return user
  })
