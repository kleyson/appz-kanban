import { useState, useCallback } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useUpdateSettings, useResetSettings, useTestWebhook } from '../api/hooks'
import type { WebhookEvent } from '../types'

interface WebhookTestResult {
  success: boolean
  error?: string
}

interface UseSettingsFormReturn {
  // Due date settings
  defaultDueDays: number
  setDefaultDueDays: (value: number) => void
  defaultColumns: string
  setDefaultColumns: (value: string) => void

  // Due date warnings
  urgent: number
  setUrgent: (value: number) => void
  warning: number
  setWarning: (value: number) => void
  approaching: number
  setApproaching: (value: number) => void

  // Fullscreen mode
  autoRefresh: number
  setAutoRefresh: (value: number) => void
  showClock: boolean
  setShowClock: (value: boolean) => void

  // Card rotting
  rottingEnabled: boolean
  setRottingEnabled: (value: boolean) => void
  rottingSlight: number
  setRottingSlight: (value: number) => void
  rottingMedium: number
  setRottingMedium: (value: number) => void
  rottingHeavy: number
  setRottingHeavy: (value: number) => void

  // Webhooks
  webhookEnabled: boolean
  setWebhookEnabled: (value: boolean) => void
  webhookUrl: string
  setWebhookUrl: (value: string) => void
  webhookSecret: string
  setWebhookSecret: (value: string) => void
  webhookEvents: WebhookEvent[]
  setWebhookEvents: (value: WebhookEvent[]) => void
  webhookTestResult: WebhookTestResult | null
  handleTestWebhook: () => Promise<void>

  // Actions
  handleSave: () => void
  handleReset: () => void

  // Loading states
  isSaving: boolean
  isResetting: boolean
  isTesting: boolean
  saveSuccess: boolean
  resetSuccess: boolean
}

export function useSettingsForm(): UseSettingsFormReturn {
  const { settings } = useSettingsStore()
  const updateSettings = useUpdateSettings()
  const resetSettings = useResetSettings()
  const testWebhook = useTestWebhook()

  // Due date settings
  const [defaultDueDays, setDefaultDueDays] = useState(settings.defaultDueDays)
  const [defaultColumns, setDefaultColumns] = useState(settings.defaultColumns.join(', '))

  // Due date warnings
  const [urgent, setUrgent] = useState(settings.dueDateWarnings.urgent)
  const [warning, setWarning] = useState(settings.dueDateWarnings.warning)
  const [approaching, setApproaching] = useState(settings.dueDateWarnings.approaching)

  // Fullscreen mode
  const [autoRefresh, setAutoRefresh] = useState(settings.fullscreen.autoRefreshInterval)
  const [showClock, setShowClock] = useState(settings.fullscreen.showClock)

  // Card rotting
  const [rottingEnabled, setRottingEnabled] = useState(settings.cardRotting?.enabled ?? true)
  const [rottingSlight, setRottingSlight] = useState(settings.cardRotting?.thresholds?.slight ?? 3)
  const [rottingMedium, setRottingMedium] = useState(settings.cardRotting?.thresholds?.medium ?? 7)
  const [rottingHeavy, setRottingHeavy] = useState(settings.cardRotting?.thresholds?.heavy ?? 14)

  // Webhooks
  const [webhookEnabled, setWebhookEnabled] = useState(settings.webhook?.enabled ?? false)
  const [webhookUrl, setWebhookUrl] = useState(settings.webhook?.url ?? '')
  const [webhookSecret, setWebhookSecret] = useState(settings.webhook?.secret ?? '')
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>(settings.webhook?.events ?? [])
  const [webhookTestResult, setWebhookTestResult] = useState<WebhookTestResult | null>(null)

  const handleTestWebhook = useCallback(async () => {
    setWebhookTestResult(null)
    const result = await testWebhook.mutateAsync({
      enabled: webhookEnabled,
      url: webhookUrl,
      secret: webhookSecret,
      events: webhookEvents,
    })
    setWebhookTestResult(result)
  }, [testWebhook, webhookEnabled, webhookUrl, webhookSecret, webhookEvents])

  const handleSave = useCallback(() => {
    updateSettings.mutate({
      defaultDueDays,
      defaultColumns: defaultColumns
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      dueDateWarnings: { urgent, warning, approaching },
      fullscreen: { autoRefreshInterval: autoRefresh, showClock },
      cardRotting: {
        enabled: rottingEnabled,
        thresholds: {
          slight: rottingSlight,
          medium: rottingMedium,
          heavy: rottingHeavy,
        },
      },
      webhook: {
        enabled: webhookEnabled,
        url: webhookUrl,
        secret: webhookSecret,
        events: webhookEvents,
      },
    })
  }, [
    updateSettings,
    defaultDueDays,
    defaultColumns,
    urgent,
    warning,
    approaching,
    autoRefresh,
    showClock,
    rottingEnabled,
    rottingSlight,
    rottingMedium,
    rottingHeavy,
    webhookEnabled,
    webhookUrl,
    webhookSecret,
    webhookEvents,
  ])

  const handleReset = useCallback(() => {
    resetSettings.mutate(undefined, {
      onSuccess: () => {
        setDefaultDueDays(3)
        setDefaultColumns('To Do, In Progress, Review, Done')
        setUrgent(1)
        setWarning(24)
        setApproaching(72)
        setAutoRefresh(30)
        setShowClock(true)
        setRottingEnabled(true)
        setRottingSlight(3)
        setRottingMedium(7)
        setRottingHeavy(14)
        setWebhookEnabled(false)
        setWebhookUrl('')
        setWebhookSecret('')
        setWebhookEvents([])
        setWebhookTestResult(null)
      },
    })
  }, [resetSettings])

  return {
    // Due date settings
    defaultDueDays,
    setDefaultDueDays,
    defaultColumns,
    setDefaultColumns,

    // Due date warnings
    urgent,
    setUrgent,
    warning,
    setWarning,
    approaching,
    setApproaching,

    // Fullscreen mode
    autoRefresh,
    setAutoRefresh,
    showClock,
    setShowClock,

    // Card rotting
    rottingEnabled,
    setRottingEnabled,
    rottingSlight,
    setRottingSlight,
    rottingMedium,
    setRottingMedium,
    rottingHeavy,
    setRottingHeavy,

    // Webhooks
    webhookEnabled,
    setWebhookEnabled,
    webhookUrl,
    setWebhookUrl,
    webhookSecret,
    setWebhookSecret,
    webhookEvents,
    setWebhookEvents,
    webhookTestResult,
    handleTestWebhook,

    // Actions
    handleSave,
    handleReset,

    // Loading states
    isSaving: updateSettings.isPending,
    isResetting: resetSettings.isPending,
    isTesting: testWebhook.isPending,
    saveSuccess: updateSettings.isSuccess,
    resetSuccess: resetSettings.isSuccess,
  }
}
