import { eq, and, gt, sql } from 'drizzle-orm'
import { db, rawDb } from '../db/connection'
import { refreshTokens } from '../db/schema'
import type { RefreshToken } from '../db/schema'
import { randomBytes } from 'crypto'

const REFRESH_TOKEN_EXPIRY_DAYS = 30

export class RefreshTokenRepository {
  generateToken(): string {
    return randomBytes(32).toString('hex')
  }

  create(userId: number): RefreshToken {
    const token = this.generateToken()
    const expiresAt = Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60

    const result = db
      .insert(refreshTokens)
      .values({
        userId,
        token,
        expiresAt,
      })
      .returning()
      .get()

    return result
  }

  findByToken(token: string): RefreshToken | null {
    return db.select().from(refreshTokens).where(eq(refreshTokens.token, token)).get() ?? null
  }

  findValidByToken(token: string): RefreshToken | null {
    const now = Math.floor(Date.now() / 1000)
    return (
      db
        .select()
        .from(refreshTokens)
        .where(and(eq(refreshTokens.token, token), gt(refreshTokens.expiresAt, sql`${now}`)))
        .get() ?? null
    )
  }

  delete(token: string): boolean {
    const result = rawDb.run('DELETE FROM refresh_tokens WHERE token = ?', [token])
    return result.changes > 0
  }

  deleteAllForUser(userId: number): void {
    db.delete(refreshTokens).where(eq(refreshTokens.userId, userId)).run()
  }

  deleteExpired(): number {
    const now = Math.floor(Date.now() / 1000)
    const result = rawDb.run('DELETE FROM refresh_tokens WHERE expires_at < ?', [now])
    return result.changes
  }

  rotateToken(oldToken: string, userId: number): RefreshToken | null {
    // Delete the old token
    this.delete(oldToken)
    // Create a new one
    return this.create(userId)
  }
}

export const refreshTokenRepository = new RefreshTokenRepository()
