import { eq, and, isNull, gt } from 'drizzle-orm'
import { db, rawDb } from '../db/connection'
import { invites, users } from '../db/schema'
import type { Invite, InviteWithCreator } from '../types'
import { randomBytes } from 'crypto'

export class InviteRepository {
  generateCode(): string {
    return randomBytes(16).toString('hex')
  }

  create(createdBy: number, expiresAt: Date): Invite {
    const code = this.generateCode()
    const result = db
      .insert(invites)
      .values({
        code,
        createdBy,
        expiresAt: expiresAt.toISOString(),
      })
      .returning()
      .get()

    return {
      ...result,
      createdAt: result.createdAt!,
    }
  }

  findByCode(code: string): Invite | null {
    const result = db.select().from(invites).where(eq(invites.code, code)).get()

    if (!result) return null

    return {
      ...result,
      createdAt: result.createdAt!,
    }
  }

  findById(id: number): Invite | null {
    const result = db.select().from(invites).where(eq(invites.id, id)).get()

    if (!result) return null

    return {
      ...result,
      createdAt: result.createdAt!,
    }
  }

  markAsUsed(id: number, userId: number): void {
    db.update(invites)
      .set({
        usedBy: userId,
        usedAt: new Date().toISOString(),
      })
      .where(eq(invites.id, id))
      .run()
  }

  findAllPending(): InviteWithCreator[] {
    const now = new Date().toISOString()
    const results = db
      .select({
        invite: invites,
        creator: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          role: users.role,
        },
      })
      .from(invites)
      .leftJoin(users, eq(invites.createdBy, users.id))
      .where(and(isNull(invites.usedAt), gt(invites.expiresAt, now)))
      .all()

    return results.map((row) => ({
      ...row.invite,
      createdAt: row.invite.createdAt!,
      creator: row.creator
        ? {
            id: row.creator.id,
            username: row.creator.username,
            displayName: row.creator.displayName,
            role: row.creator.role as 'admin' | 'user',
          }
        : undefined,
    }))
  }

  revoke(id: number): boolean {
    const result = rawDb.run('DELETE FROM invites WHERE id = ?', [id])
    return result.changes > 0
  }

  isValid(invite: Invite): { valid: boolean; reason?: 'expired' | 'used' } {
    if (invite.usedAt) {
      return { valid: false, reason: 'used' }
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return { valid: false, reason: 'expired' }
    }

    return { valid: true }
  }
}

export const inviteRepository = new InviteRepository()
