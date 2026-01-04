import { eq, asc, sql, and, gt, gte, lt, lte } from 'drizzle-orm'
import { db, rawDb } from '../db/connection'
import { cards, cardLabels, labels, users } from '../db/schema'
import type { Card, Label, UserPublic, Priority, Subtask } from '../types'
import type { SQLQueryBindings } from 'bun:sqlite'

export class CardRepository {
  private parseSubtasks(subtasksJson: string | null): Subtask[] {
    if (!subtasksJson) return []
    try {
      return JSON.parse(subtasksJson)
    } catch {
      return []
    }
  }

  private toCard(row: typeof cards.$inferSelect): Card {
    return {
      id: row.id,
      columnId: row.columnId,
      title: row.title,
      description: row.description,
      position: row.position,
      dueDate: row.dueDate,
      priority: row.priority,
      color: row.color,
      assigneeId: row.assigneeId,
      subtasks: this.parseSubtasks(row.subtasks),
      createdAt: row.createdAt!,
      updatedAt: row.updatedAt!,
    }
  }

  findById(id: number): Card | null {
    const row = db.select().from(cards).where(eq(cards.id, id)).get()

    if (!row) return null

    const card = this.toCard(row)
    card.labels = this.getLabels(id)
    card.assignee = this.getAssignee(card.assigneeId)
    return card
  }

  findByColumnId(columnId: number): Card[] {
    const rows = db
      .select()
      .from(cards)
      .where(eq(cards.columnId, columnId))
      .orderBy(asc(cards.position))
      .all()

    return rows.map((row) => {
      const card = this.toCard(row)
      card.labels = this.getLabels(card.id)
      card.assignee = this.getAssignee(card.assigneeId)
      return card
    })
  }

  private getLabels(cardId: number): Label[] {
    return db
      .select({
        id: labels.id,
        boardId: labels.boardId,
        name: labels.name,
        color: labels.color,
      })
      .from(labels)
      .innerJoin(cardLabels, eq(labels.id, cardLabels.labelId))
      .where(eq(cardLabels.cardId, cardId))
      .all()
  }

  private getAssignee(assigneeId: number | null): UserPublic | null {
    if (!assigneeId) return null
    const row = db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.id, assigneeId))
      .get()

    return row ?? null
  }

  create(
    columnId: number,
    data: {
      title: string
      description?: string
      dueDate?: string
      priority?: Priority
      color?: string
      assigneeId?: number
      labelIds?: number[]
      subtasks?: Subtask[]
    }
  ): Card {
    const maxPos = db
      .select({ maxPos: sql<number>`COALESCE(MAX(${cards.position}), -1)` })
      .from(cards)
      .where(eq(cards.columnId, columnId))
      .get()

    const position = (maxPos?.maxPos ?? -1) + 1
    const subtasksJson = data.subtasks ? JSON.stringify(data.subtasks) : '[]'

    const result = db
      .insert(cards)
      .values({
        columnId,
        title: data.title,
        description: data.description ?? null,
        position,
        dueDate: data.dueDate ?? null,
        priority: data.priority ?? null,
        color: data.color ?? null,
        assigneeId: data.assigneeId ?? null,
        subtasks: subtasksJson,
      })
      .returning()
      .get()

    const cardId = result.id

    if (data.labelIds?.length) {
      this.setLabels(cardId, data.labelIds)
    }

    return this.findById(cardId)!
  }

  update(
    id: number,
    data: {
      title?: string
      description?: string | null
      dueDate?: string | null
      priority?: Priority | null
      color?: string | null
      assigneeId?: number | null
      labelIds?: number[]
      subtasks?: Subtask[]
    }
  ): Card | null {
    // Build SQL dynamically for update
    const sets: string[] = []
    const values: SQLQueryBindings[] = []

    if (data.title !== undefined) {
      sets.push('title = ?')
      values.push(data.title)
    }
    if (data.description !== undefined) {
      sets.push('description = ?')
      values.push(data.description)
    }
    if (data.dueDate !== undefined) {
      sets.push('due_date = ?')
      values.push(data.dueDate)
    }
    if (data.priority !== undefined) {
      sets.push('priority = ?')
      values.push(data.priority)
    }
    if (data.color !== undefined) {
      sets.push('color = ?')
      values.push(data.color)
    }
    if (data.assigneeId !== undefined) {
      sets.push('assignee_id = ?')
      values.push(data.assigneeId)
    }
    if (data.subtasks !== undefined) {
      sets.push('subtasks = ?')
      values.push(JSON.stringify(data.subtasks))
    }

    if (sets.length > 0) {
      sets.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      rawDb.run(`UPDATE cards SET ${sets.join(', ')} WHERE id = ?`, values)
    }

    if (data.labelIds !== undefined) {
      this.setLabels(id, data.labelIds)
    }

    return this.findById(id)
  }

  delete(id: number): boolean {
    const result = rawDb.run(`DELETE FROM cards WHERE id = ?`, [id])
    return result.changes > 0
  }

  move(id: number, toColumnId: number, toPosition: number): Card | null {
    const card = this.findById(id)
    if (!card) return null

    const fromColumnId = card.columnId

    if (fromColumnId === toColumnId) {
      if (card.position < toPosition) {
        db.update(cards)
          .set({ position: sql`${cards.position} - 1` })
          .where(
            and(
              eq(cards.columnId, toColumnId),
              gt(cards.position, card.position),
              lte(cards.position, toPosition)
            )
          )
          .run()
      } else {
        db.update(cards)
          .set({ position: sql`${cards.position} + 1` })
          .where(
            and(
              eq(cards.columnId, toColumnId),
              gte(cards.position, toPosition),
              lt(cards.position, card.position)
            )
          )
          .run()
      }
    } else {
      db.update(cards)
        .set({ position: sql`${cards.position} - 1` })
        .where(and(eq(cards.columnId, fromColumnId), gt(cards.position, card.position)))
        .run()

      db.update(cards)
        .set({ position: sql`${cards.position} + 1` })
        .where(and(eq(cards.columnId, toColumnId), gte(cards.position, toPosition)))
        .run()
    }

    rawDb.run(
      `UPDATE cards SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [toColumnId, toPosition, id]
    )

    return this.findById(id)
  }

  private setLabels(cardId: number, labelIds: number[]): void {
    rawDb.run(`DELETE FROM card_labels WHERE card_id = ?`, [cardId])

    if (labelIds.length) {
      for (const labelId of labelIds) {
        db.insert(cardLabels).values({ cardId, labelId }).run()
      }
    }
  }

  getColumnId(cardId: number): number | null {
    const card = db
      .select({ columnId: cards.columnId })
      .from(cards)
      .where(eq(cards.id, cardId))
      .get()
    return card?.columnId ?? null
  }
}

export const cardRepository = new CardRepository()
