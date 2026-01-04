import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSettings, CustomEmoji } from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface SettingsState {
  settings: UserSettings
  isFullscreen: boolean
  setSettings: (settings: Partial<UserSettings>) => void
  resetSettings: () => void
  setFullscreen: (isFullscreen: boolean) => void
  toggleFullscreen: () => void
  addCustomEmoji: (emoji: CustomEmoji) => void
  removeCustomEmoji: (shortcode: string) => void
  updateCustomEmoji: (shortcode: string, updates: Partial<CustomEmoji>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      isFullscreen: false,
      setSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
            dueDateWarnings: {
              ...state.settings.dueDateWarnings,
              ...(newSettings.dueDateWarnings || {}),
            },
            fullscreen: {
              ...state.settings.fullscreen,
              ...(newSettings.fullscreen || {}),
            },
            cardRotting: {
              ...state.settings.cardRotting,
              ...(newSettings.cardRotting || {}),
              thresholds: {
                ...state.settings.cardRotting?.thresholds,
                ...(newSettings.cardRotting?.thresholds || {}),
              },
            },
            webhook: {
              ...state.settings.webhook,
              ...(newSettings.webhook || {}),
            },
            customEmojis: newSettings.customEmojis ?? state.settings.customEmojis,
          },
        })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      setFullscreen: (isFullscreen) => set({ isFullscreen }),
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
      addCustomEmoji: (emoji) =>
        set((state) => ({
          settings: {
            ...state.settings,
            customEmojis: [...state.settings.customEmojis, emoji],
          },
        })),
      removeCustomEmoji: (shortcode) =>
        set((state) => ({
          settings: {
            ...state.settings,
            customEmojis: state.settings.customEmojis.filter((e) => e.shortcode !== shortcode),
          },
        })),
      updateCustomEmoji: (shortcode, updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            customEmojis: state.settings.customEmojis.map((e) =>
              e.shortcode === shortcode ? { ...e, ...updates } : e
            ),
          },
        })),
    }),
    {
      name: 'appz-kanban-settings',
    }
  )
)
