import { settingsRepository } from '../repositories/SettingsRepository'
import type { UserSettings } from '../types'

class SettingsService {
  getSettings(userId: number): UserSettings {
    return settingsRepository.findByUserId(userId)
  }

  updateSettings(userId: number, settings: Partial<UserSettings>): UserSettings {
    return settingsRepository.upsert(userId, settings)
  }

  resetSettings(userId: number): boolean {
    return settingsRepository.delete(userId)
  }
}

export const settingsService = new SettingsService()
