import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useSettingsForm } from '../useSettingsForm'

// Mock settings store
const mockSettings = {
  defaultDueDays: 3,
  defaultColumns: ['To Do', 'In Progress', 'Done'],
  dueDateWarnings: {
    urgent: 1,
    warning: 24,
    approaching: 72,
  },
  fullscreen: {
    autoRefreshInterval: 30,
    showClock: true,
  },
  cardRotting: {
    enabled: true,
    thresholds: {
      slight: 3,
      medium: 7,
      heavy: 14,
    },
  },
  webhook: {
    enabled: false,
    url: '',
    secret: '',
    events: [],
  },
  customEmojis: [],
}

mock.module('../../stores/settingsStore', () => ({
  useSettingsStore: () => ({
    settings: mockSettings,
  }),
}))

// Mock API hooks
const mockUpdateMutate = mock((_data: unknown) => {})
const mockResetMutate = mock((_: unknown, options: { onSuccess?: () => void }) => {
  options?.onSuccess?.()
})
const mockTestWebhookMutateAsync = mock((_data: unknown) => Promise.resolve({ success: true }))

mock.module('../../api/hooks', () => ({
  useUpdateSettings: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
    isSuccess: false,
  }),
  useResetSettings: () => ({
    mutate: mockResetMutate,
    isPending: false,
    isSuccess: false,
  }),
  useTestWebhook: () => ({
    mutateAsync: mockTestWebhookMutateAsync,
    isPending: false,
  }),
}))

describe('useSettingsForm', () => {
  beforeEach(() => {
    mockUpdateMutate.mockClear()
    mockResetMutate.mockClear()
    mockTestWebhookMutateAsync.mockClear()
  })

  describe('initial state', () => {
    it('should initialize due date settings from store', () => {
      const { result } = renderHook(() => useSettingsForm())

      expect(result.current.defaultDueDays).toBe(3)
      expect(result.current.defaultColumns).toBe('To Do, In Progress, Done')
    })

    it('should initialize due date warnings from store', () => {
      const { result } = renderHook(() => useSettingsForm())

      expect(result.current.urgent).toBe(1)
      expect(result.current.warning).toBe(24)
      expect(result.current.approaching).toBe(72)
    })

    it('should initialize fullscreen settings from store', () => {
      const { result } = renderHook(() => useSettingsForm())

      expect(result.current.autoRefresh).toBe(30)
      expect(result.current.showClock).toBe(true)
    })

    it('should initialize card rotting settings from store', () => {
      const { result } = renderHook(() => useSettingsForm())

      expect(result.current.rottingEnabled).toBe(true)
      expect(result.current.rottingSlight).toBe(3)
      expect(result.current.rottingMedium).toBe(7)
      expect(result.current.rottingHeavy).toBe(14)
    })

    it('should initialize webhook settings from store', () => {
      const { result } = renderHook(() => useSettingsForm())

      expect(result.current.webhookEnabled).toBe(false)
      expect(result.current.webhookUrl).toBe('')
      expect(result.current.webhookSecret).toBe('')
      expect(result.current.webhookEvents).toEqual([])
      expect(result.current.webhookTestResult).toBeNull()
    })
  })

  describe('state updates', () => {
    it('should update defaultDueDays', () => {
      const { result } = renderHook(() => useSettingsForm())

      act(() => {
        result.current.setDefaultDueDays(7)
      })

      expect(result.current.defaultDueDays).toBe(7)
    })

    it('should update defaultColumns', () => {
      const { result } = renderHook(() => useSettingsForm())

      act(() => {
        result.current.setDefaultColumns('Todo, Done')
      })

      expect(result.current.defaultColumns).toBe('Todo, Done')
    })

    it('should update due date warnings', () => {
      const { result } = renderHook(() => useSettingsForm())

      act(() => {
        result.current.setUrgent(2)
        result.current.setWarning(48)
        result.current.setApproaching(120)
      })

      expect(result.current.urgent).toBe(2)
      expect(result.current.warning).toBe(48)
      expect(result.current.approaching).toBe(120)
    })

    it('should update fullscreen settings', () => {
      const { result } = renderHook(() => useSettingsForm())

      act(() => {
        result.current.setAutoRefresh(60)
        result.current.setShowClock(false)
      })

      expect(result.current.autoRefresh).toBe(60)
      expect(result.current.showClock).toBe(false)
    })

    it('should update card rotting settings', () => {
      const { result } = renderHook(() => useSettingsForm())

      act(() => {
        result.current.setRottingEnabled(false)
        result.current.setRottingSlight(5)
        result.current.setRottingMedium(10)
        result.current.setRottingHeavy(20)
      })

      expect(result.current.rottingEnabled).toBe(false)
      expect(result.current.rottingSlight).toBe(5)
      expect(result.current.rottingMedium).toBe(10)
      expect(result.current.rottingHeavy).toBe(20)
    })

    it('should update webhook settings', () => {
      const { result } = renderHook(() => useSettingsForm())

      act(() => {
        result.current.setWebhookEnabled(true)
        result.current.setWebhookUrl('https://example.com/webhook')
        result.current.setWebhookSecret('secret123')
        result.current.setWebhookEvents(['card.created', 'card.updated'] as any)
      })

      expect(result.current.webhookEnabled).toBe(true)
      expect(result.current.webhookUrl).toBe('https://example.com/webhook')
      expect(result.current.webhookSecret).toBe('secret123')
      expect(result.current.webhookEvents).toEqual(['card.created', 'card.updated'])
    })
  })

  describe('handleSave', () => {
    it('should call updateSettings.mutate with all settings', () => {
      const { result } = renderHook(() => useSettingsForm())

      act(() => {
        result.current.handleSave()
      })

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        defaultDueDays: 3,
        defaultColumns: ['To Do', 'In Progress', 'Done'],
        dueDateWarnings: { urgent: 1, warning: 24, approaching: 72 },
        fullscreen: { autoRefreshInterval: 30, showClock: true },
        cardRotting: {
          enabled: true,
          thresholds: { slight: 3, medium: 7, heavy: 14 },
        },
        webhook: {
          enabled: false,
          url: '',
          secret: '',
          events: [],
        },
      })
    })

    it('should parse defaultColumns string into array', () => {
      const { result } = renderHook(() => useSettingsForm())

      act(() => {
        result.current.setDefaultColumns('  Alpha ,  Beta  ,  Gamma  ')
      })

      act(() => {
        result.current.handleSave()
      })

      const calls = mockUpdateMutate.mock.calls as unknown[][]
      const call = calls[0][0] as Record<string, unknown>
      expect(call.defaultColumns).toEqual(['Alpha', 'Beta', 'Gamma'])
    })

    it('should filter empty strings from defaultColumns', () => {
      const { result } = renderHook(() => useSettingsForm())

      act(() => {
        result.current.setDefaultColumns('Alpha, , Beta, , Gamma')
      })

      act(() => {
        result.current.handleSave()
      })

      const calls = mockUpdateMutate.mock.calls as unknown[][]
      const call = calls[0][0] as Record<string, unknown>
      expect(call.defaultColumns).toEqual(['Alpha', 'Beta', 'Gamma'])
    })

    it('should include updated values when saving', () => {
      const { result } = renderHook(() => useSettingsForm())

      act(() => {
        result.current.setDefaultDueDays(5)
        result.current.setUrgent(2)
        result.current.setWebhookEnabled(true)
      })

      act(() => {
        result.current.handleSave()
      })

      const calls = mockUpdateMutate.mock.calls as unknown[][]
      const call = calls[0][0] as Record<string, unknown>
      expect(call.defaultDueDays).toBe(5)
      expect((call.dueDateWarnings as Record<string, unknown>).urgent).toBe(2)
      expect((call.webhook as Record<string, unknown>).enabled).toBe(true)
    })
  })

  describe('handleReset', () => {
    it('should call resetSettings.mutate', () => {
      const { result } = renderHook(() => useSettingsForm())

      act(() => {
        result.current.handleReset()
      })

      expect(mockResetMutate).toHaveBeenCalled()
    })

    it('should reset all form values to defaults on success', () => {
      const { result } = renderHook(() => useSettingsForm())

      // Change some values
      act(() => {
        result.current.setDefaultDueDays(10)
        result.current.setUrgent(5)
        result.current.setWebhookEnabled(true)
        result.current.setWebhookUrl('https://test.com')
      })

      // Reset
      act(() => {
        result.current.handleReset()
      })

      // Values should be reset to defaults
      expect(result.current.defaultDueDays).toBe(3)
      expect(result.current.defaultColumns).toBe('To Do, In Progress, Review, Done')
      expect(result.current.urgent).toBe(1)
      expect(result.current.warning).toBe(24)
      expect(result.current.approaching).toBe(72)
      expect(result.current.autoRefresh).toBe(30)
      expect(result.current.showClock).toBe(true)
      expect(result.current.rottingEnabled).toBe(true)
      expect(result.current.rottingSlight).toBe(3)
      expect(result.current.rottingMedium).toBe(7)
      expect(result.current.rottingHeavy).toBe(14)
      expect(result.current.webhookEnabled).toBe(false)
      expect(result.current.webhookUrl).toBe('')
      expect(result.current.webhookSecret).toBe('')
      expect(result.current.webhookEvents).toEqual([])
      expect(result.current.webhookTestResult).toBeNull()
    })
  })

  describe('handleTestWebhook', () => {
    it('should call testWebhook.mutateAsync with current webhook settings', async () => {
      const { result } = renderHook(() => useSettingsForm())

      act(() => {
        result.current.setWebhookEnabled(true)
        result.current.setWebhookUrl('https://test.com/webhook')
        result.current.setWebhookSecret('secret')
        result.current.setWebhookEvents(['card.created'] as any)
      })

      await act(async () => {
        await result.current.handleTestWebhook()
      })

      expect(mockTestWebhookMutateAsync).toHaveBeenCalledWith({
        enabled: true,
        url: 'https://test.com/webhook',
        secret: 'secret',
        events: ['card.created'],
      })
    })

    it('should set webhookTestResult on success', async () => {
      const { result } = renderHook(() => useSettingsForm())

      await act(async () => {
        await result.current.handleTestWebhook()
      })

      expect(result.current.webhookTestResult).toEqual({ success: true })
    })

    it('should clear previous test result before testing', async () => {
      mockTestWebhookMutateAsync.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 10))
      )

      const { result } = renderHook(() => useSettingsForm())

      // First test
      await act(async () => {
        await result.current.handleTestWebhook()
      })

      expect(result.current.webhookTestResult).toEqual({ success: true })

      // Reset mock for second test
      mockTestWebhookMutateAsync.mockImplementation(() =>
        Promise.resolve({ success: false, error: 'Failed' })
      )

      // Second test should clear previous result first
      await act(async () => {
        await result.current.handleTestWebhook()
      })

      expect(result.current.webhookTestResult).toEqual({ success: false, error: 'Failed' })
    })
  })

  describe('loading states', () => {
    it('should expose loading states from mutations', () => {
      const { result } = renderHook(() => useSettingsForm())

      expect(result.current.isSaving).toBe(false)
      expect(result.current.isResetting).toBe(false)
      expect(result.current.isTesting).toBe(false)
    })

    it('should expose success states from mutations', () => {
      const { result } = renderHook(() => useSettingsForm())

      expect(result.current.saveSuccess).toBe(false)
      expect(result.current.resetSuccess).toBe(false)
    })
  })
})
