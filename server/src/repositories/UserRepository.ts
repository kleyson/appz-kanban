import { eq, count } from 'drizzle-orm'
import { db, rawDb } from '../db/connection'
import { users } from '../db/schema'
import type { User, UserPublic, UserRole } from '../types'

export class UserRepository {
  findById(id: number): User | null {
    const row = db.select().from(users).where(eq(users.id, id)).get()
    if (!row) return null
    return { ...row, createdAt: row.createdAt!, role: row.role as UserRole }
  }

  findByUsername(username: string): User | null {
    const row = db.select().from(users).where(eq(users.username, username)).get()
    if (!row) return null
    return { ...row, createdAt: row.createdAt!, role: row.role as UserRole }
  }

  findPublicById(id: number): UserPublic | null {
    const row = db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, id))
      .get()

    if (!row) return null
    return { ...row, role: row.role as UserRole }
  }

  countUsers(): number {
    const result = db.select({ count: count() }).from(users).get()
    return result?.count ?? 0
  }

  hasAnyUsers(): boolean {
    return this.countUsers() > 0
  }

  create(
    username: string,
    passwordHash: string,
    displayName: string,
    role: UserRole = 'user'
  ): User {
    const result = db
      .insert(users)
      .values({ username, passwordHash, displayName, role })
      .returning()
      .get()

    return { ...result, createdAt: result.createdAt!, role: result.role as UserRole }
  }

  update(id: number, data: { displayName?: string }): User | null {
    if (Object.keys(data).length === 0) {
      return this.findById(id)
    }

    const result = db.update(users).set(data).where(eq(users.id, id)).returning().get()

    if (!result) return null
    return { ...result, createdAt: result.createdAt!, role: result.role as UserRole }
  }

  delete(id: number): boolean {
    const result = rawDb.run(`DELETE FROM users WHERE id = ?`, [id])
    return result.changes > 0
  }
}

export const userRepository = new UserRepository()
