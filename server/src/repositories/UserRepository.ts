import { eq } from 'drizzle-orm'
import { db, rawDb } from '../db/connection'
import { users } from '../db/schema'
import type { User, UserPublic } from '../types'

export class UserRepository {
  findById(id: number): User | null {
    const row = db.select().from(users).where(eq(users.id, id)).get()
    if (!row) return null
    return { ...row, createdAt: row.createdAt! }
  }

  findByUsername(username: string): User | null {
    const row = db.select().from(users).where(eq(users.username, username)).get()
    if (!row) return null
    return { ...row, createdAt: row.createdAt! }
  }

  findPublicById(id: number): UserPublic | null {
    const row = db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.id, id))
      .get()

    return row ?? null
  }

  create(username: string, passwordHash: string, displayName: string): User {
    const result = db
      .insert(users)
      .values({ username, passwordHash, displayName })
      .returning()
      .get()

    return { ...result, createdAt: result.createdAt! }
  }

  update(id: number, data: { displayName?: string }): User | null {
    if (Object.keys(data).length === 0) {
      return this.findById(id)
    }

    const result = db.update(users).set(data).where(eq(users.id, id)).returning().get()

    if (!result) return null
    return { ...result, createdAt: result.createdAt! }
  }

  delete(id: number): boolean {
    const result = rawDb.run(`DELETE FROM users WHERE id = ?`, [id])
    return result.changes > 0
  }
}

export const userRepository = new UserRepository()
