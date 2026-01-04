import { describe, it, expect, beforeEach } from 'bun:test'
import { useSettingsStore } from '../settingsStore'
import { DEFAULT_SETTINGS } from '../../types'

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: DEFAULT_SETTINGS,
      isFullscreen: false,
    })
  })

  it('should initialize with default settings', () => {
    const state = useSettingsStore.getState()
    expect(state.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('should initialize with isFullscreen as false', () => {
    const state = useSettingsStore.getState()
    expect(state.isFullscreen).toBe(false)
  })

  it('should update settings partially', () => {
    const { setSettings } = useSettingsStore.getState()

    setSettings({ defaultDueDays: 5 })

    const state = useSettingsStore.getState()
    expect(state.settings.defaultDueDays).toBe(5)
    // Other settings should remain unchanged
    expect(state.settings.defaultColumns).toEqual(DEFAULT_SETTINGS.defaultColumns)
  })

  it('should update nested dueDateWarnings', () => {
    const { setSettings } = useSettingsStore.getState()

    setSettings({ dueDateWarnings: { urgent: 2, warning: 48, approaching: 96 } })

    const state = useSettingsStore.getState()
    expect(state.settings.dueDateWarnings.urgent).toBe(2)
    expect(state.settings.dueDateWarnings.warning).toBe(48)
    expect(state.settings.dueDateWarnings.approaching).toBe(96)
  })

  it('should update nested fullscreen settings', () => {
    const { setSettings } = useSettingsStore.getState()

    setSettings({ fullscreen: { autoRefreshInterval: 60, showClock: false } })

    const state = useSettingsStore.getState()
    expect(state.settings.fullscreen.autoRefreshInterval).toBe(60)
    expect(state.settings.fullscreen.showClock).toBe(false)
  })

  it('should reset settings to defaults', () => {
    const { setSettings, resetSettings } = useSettingsStore.getState()

    setSettings({ defaultDueDays: 10 })
    resetSettings()

    const state = useSettingsStore.getState()
    expect(state.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('should set fullscreen state', () => {
    const { setFullscreen } = useSettingsStore.getState()

    setFullscreen(true)

    const state = useSettingsStore.getState()
    expect(state.isFullscreen).toBe(true)
  })

  it('should toggle fullscreen state', () => {
    const { toggleFullscreen } = useSettingsStore.getState()

    toggleFullscreen()
    expect(useSettingsStore.getState().isFullscreen).toBe(true)

    toggleFullscreen()
    expect(useSettingsStore.getState().isFullscreen).toBe(false)
  })
})
