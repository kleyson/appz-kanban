import { eq, or, desc, sql, and } from 'drizzle-orm'
import { db, rawDb } from '../db/connection'
import { boards, boardMembers, users } from '../db/schema'
import type { Board, BoardMember, UserPublic } from '../types'

export class BoardRepository {
  findById(id: number): Board | null {
    const row = db.select().from(boards).where(eq(boards.id, id)).get()
    if (!row) return null
    return { ...row, createdAt: row.createdAt!, updatedAt: row.updatedAt! }
  }

  findByUserId(userId: number): Board[] {
    const result = db
      .select({
        id: boards.id,
        name: boards.name,
        ownerId: boards.ownerId,
        createdAt: boards.createdAt,
        updatedAt: boards.updatedAt,
      })
      .from(boards)
      .leftJoin(boardMembers, eq(boards.id, boardMembers.boardId))
      .where(or(eq(boards.ownerId, userId), eq(boardMembers.userId, userId)))
      .groupBy(boards.id)
      .orderBy(desc(boards.updatedAt))
      .all()

    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt!,
      updatedAt: row.updatedAt!,
    }))
  }

  create(name: string, ownerId: number): Board {
    const result = db.insert(boards).values({ name, ownerId }).returning().get()

    // Add owner as a member with 'owner' role
    db.insert(boardMembers).values({ boardId: result.id, userId: ownerId, role: 'owner' }).run()

    return { ...result, createdAt: result.createdAt!, updatedAt: result.updatedAt! }
  }

  update(id: number, data: { name?: string }): Board | null {
    const result = db
      .update(boards)
      .set({ ...data, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(boards.id, id))
      .returning()
      .get()

    if (!result) return null
    return { ...result, createdAt: result.createdAt!, updatedAt: result.updatedAt! }
  }

  delete(id: number): boolean {
    const result = rawDb.run(`DELETE FROM boards WHERE id = ?`, [id])
    return result.changes > 0
  }

  getMembers(boardId: number): (BoardMember & { user: UserPublic })[] {
    const rows = db
      .select({
        boardId: boardMembers.boardId,
        userId: boardMembers.userId,
        role: boardMembers.role,
        username: users.username,
        displayName: users.displayName,
      })
      .from(boardMembers)
      .innerJoin(users, eq(boardMembers.userId, users.id))
      .where(eq(boardMembers.boardId, boardId))
      .all()

    return rows.map((row) => ({
      boardId: row.boardId,
      userId: row.userId,
      role: row.role,
      user: {
        id: row.userId,
        username: row.username,
        displayName: row.displayName,
      },
    }))
  }

  isMember(boardId: number, userId: number): boolean {
    const result = db
      .select({ count: sql<number>`1` })
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)))
      .get()
    return result !== undefined
  }

  isOwner(boardId: number, userId: number): boolean {
    const result = db
      .select({ count: sql<number>`1` })
      .from(boardMembers)
      .where(
        and(
          eq(boardMembers.boardId, boardId),
          eq(boardMembers.userId, userId),
          eq(boardMembers.role, 'owner')
        )
      )
      .get()
    return result !== undefined
  }

  addMember(boardId: number, userId: number, role: 'owner' | 'member' = 'member'): void {
    db.insert(boardMembers).values({ boardId, userId, role }).onConflictDoNothing().run()
  }

  removeMember(boardId: number, userId: number): boolean {
    const result = rawDb.run(
      `DELETE FROM board_members WHERE board_id = ? AND user_id = ? AND role != 'owner'`,
      [boardId, userId]
    )
    return result.changes > 0
  }
}

export const boardRepository = new BoardRepository()
