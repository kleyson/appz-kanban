import { eq, asc, sql, and } from 'drizzle-orm'
import { db, rawDb } from '../db/connection'
import { columns } from '../db/schema'
import type { Column } from '../types'

export class ColumnRepository {
  findById(id: number): Column | null {
    const row = db.select().from(columns).where(eq(columns.id, id)).get()
    if (!row) return null
    return { ...row, isDone: row.isDone ?? false, createdAt: row.createdAt! }
  }

  findByBoardId(boardId: number): Column[] {
    const rows = db
      .select()
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .orderBy(asc(columns.position))
      .all()
    return rows.map((row) => ({ ...row, isDone: row.isDone ?? false, createdAt: row.createdAt! }))
  }

  create(boardId: number, name: string): Column {
    const maxPos = db
      .select({ maxPos: sql<number>`COALESCE(MAX(${columns.position}), -1)` })
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .get()

    const position = (maxPos?.maxPos ?? -1) + 1
    const result = db.insert(columns).values({ boardId, name, position }).returning().get()

    return { ...result, isDone: result.isDone ?? false, createdAt: result.createdAt! }
  }

  update(id: number, data: { name?: string; isDone?: boolean }): Column | null {
    if (Object.keys(data).length === 0) {
      return this.findById(id)
    }

    const result = db.update(columns).set(data).where(eq(columns.id, id)).returning().get()
    if (!result) return null
    return { ...result, isDone: result.isDone ?? false, createdAt: result.createdAt! }
  }

  delete(id: number): boolean {
    const result = rawDb.run(`DELETE FROM columns WHERE id = ?`, [id])
    return result.changes > 0
  }

  reorder(boardId: number, columnIds: number[]): void {
    for (let i = 0; i < columnIds.length; i++) {
      db.update(columns)
        .set({ position: i })
        .where(and(eq(columns.id, columnIds[i]), eq(columns.boardId, boardId)))
        .run()
    }
  }

  getBoardId(columnId: number): number | null {
    const column = this.findById(columnId)
    return column?.boardId ?? null
  }
}

export const columnRepository = new ColumnRepository()
