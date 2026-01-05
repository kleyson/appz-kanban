import { eq, sql } from 'drizzle-orm'
import { db, rawDb } from '../db/connection'
import { userSettings } from '../db/schema'
import type { UserSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

class SettingsRepository {
  findByUserId(userId: number): UserSettings {
    const row = db.select().from(userSettings).where(eq(userSettings.userId, userId)).get()

    if (!row) {
      return DEFAULT_SETTINGS
    }

    try {
      const parsed = JSON.parse(row.settings) as Partial<UserSettings>
      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        dueDateWarnings: {
          ...DEFAULT_SETTINGS.dueDateWarnings,
          ...(parsed.dueDateWarnings || {}),
        },
        fullscreen: {
          ...DEFAULT_SETTINGS.fullscreen,
          ...(parsed.fullscreen || {}),
        },
        cardRotting: {
          ...DEFAULT_SETTINGS.cardRotting,
          ...(parsed.cardRotting || {}),
          thresholds: {
            ...DEFAULT_SETTINGS.cardRotting.thresholds,
            ...(parsed.cardRotting?.thresholds || {}),
          },
        },
        webhook: {
          ...DEFAULT_SETTINGS.webhook,
          ...(parsed.webhook || {}),
        },
      }
    } catch {
      return DEFAULT_SETTINGS
    }
  }

  upsert(userId: number, settings: Partial<UserSettings>): UserSettings {
    // Get existing settings first
    const existing = this.findByUserId(userId)

    // Merge with existing (deep merge for nested objects)
    const merged: UserSettings = {
      ...existing,
      ...settings,
      dueDateWarnings: {
        ...existing.dueDateWarnings,
        ...(settings.dueDateWarnings || {}),
      },
      fullscreen: {
        ...existing.fullscreen,
        ...(settings.fullscreen || {}),
      },
      cardRotting: {
        ...existing.cardRotting,
        ...(settings.cardRotting || {}),
        thresholds: {
          ...existing.cardRotting?.thresholds,
          ...(settings.cardRotting?.thresholds || {}),
        },
      },
      webhook: {
        ...existing.webhook,
        ...(settings.webhook || {}),
      },
    }

    const settingsJson = JSON.stringify(merged)

    db.insert(userSettings)
      .values({
        userId,
        settings: settingsJson,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          settings: settingsJson,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      })
      .run()

    return merged
  }

  delete(userId: number): boolean {
    const result = rawDb.run(`DELETE FROM user_settings WHERE user_id = ?`, [userId])
    return result.changes > 0
  }
}

export const settingsRepository = new SettingsRepository()
