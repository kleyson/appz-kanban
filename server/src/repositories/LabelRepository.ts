import { eq } from 'drizzle-orm'
import { db, rawDb } from '../db/connection'
import { labels } from '../db/schema'
import type { Label } from '../types'

export class LabelRepository {
  findById(id: number): Label | null {
    const row = db.select().from(labels).where(eq(labels.id, id)).get()
    return row ?? null
  }

  findByBoardId(boardId: number): Label[] {
    return db.select().from(labels).where(eq(labels.boardId, boardId)).all()
  }

  create(boardId: number, name: string, color: string): Label {
    return db.insert(labels).values({ boardId, name, color }).returning().get()
  }

  update(id: number, data: { name?: string; color?: string }): Label | null {
    if (Object.keys(data).length === 0) {
      return this.findById(id)
    }

    const result = db.update(labels).set(data).where(eq(labels.id, id)).returning().get()
    return result ?? null
  }

  delete(id: number): boolean {
    const result = rawDb.run(`DELETE FROM labels WHERE id = ?`, [id])
    return result.changes > 0
  }

  getBoardId(labelId: number): number | null {
    const label = this.findById(labelId)
    return label?.boardId ?? null
  }
}

export const labelRepository = new LabelRepository()
