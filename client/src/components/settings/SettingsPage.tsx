import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAuthStore } from '../../stores/authStore'
import { useUpdateSettings, useResetSettings, useVersion, useTestWebhook } from '../../api/hooks'
import InviteManagement from './InviteManagement'
import type { WebhookEvent } from '../../types'
import DueDateSettingsSection from './DueDateSettingsSection'
import DefaultColumnsSection from './DefaultColumnsSection'
import DueDateWarningsSection from './DueDateWarningsSection'
import FullscreenModeSection from './FullscreenModeSection'
import CardRottingSection from './CardRottingSection'
import CustomEmojisSection from './CustomEmojisSection'
import WebhooksSection from './WebhooksSection'

export function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { settings, addCustomEmoji, removeCustomEmoji } = useSettingsStore()
  const isAdmin = user?.role === 'admin'
  const updateSettings = useUpdateSettings()
  const resetSettings = useResetSettings()
  const { data: versionInfo } = useVersion()
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
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success: boolean
    error?: string
  } | null>(null)

  const handleTestWebhook = async () => {
    setWebhookTestResult(null)
    const result = await testWebhook.mutateAsync({
      enabled: webhookEnabled,
      url: webhookUrl,
      secret: webhookSecret,
      events: webhookEvents,
    })
    setWebhookTestResult(result)
  }

  const handleSave = () => {
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
  }

  const handleReset = () => {
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Back
          </button>
        </div>

        <div className="space-y-8">
          {/* Admin: Invite Management */}
          {isAdmin && (
            <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <InviteManagement />
            </section>
          )}

          <DueDateSettingsSection
            defaultDueDays={defaultDueDays}
            onDefaultDueDaysChange={setDefaultDueDays}
          />

          <DefaultColumnsSection
            defaultColumns={defaultColumns}
            onDefaultColumnsChange={setDefaultColumns}
          />

          <DueDateWarningsSection
            urgent={urgent}
            warning={warning}
            approaching={approaching}
            onUrgentChange={setUrgent}
            onWarningChange={setWarning}
            onApproachingChange={setApproaching}
          />

          <FullscreenModeSection
            autoRefresh={autoRefresh}
            showClock={showClock}
            onAutoRefreshChange={setAutoRefresh}
            onShowClockChange={setShowClock}
          />

          <CardRottingSection
            enabled={rottingEnabled}
            slight={rottingSlight}
            medium={rottingMedium}
            heavy={rottingHeavy}
            onEnabledChange={setRottingEnabled}
            onSlightChange={setRottingSlight}
            onMediumChange={setRottingMedium}
            onHeavyChange={setRottingHeavy}
          />

          <CustomEmojisSection
            customEmojis={settings.customEmojis}
            onAddEmoji={addCustomEmoji}
            onDeleteEmoji={removeCustomEmoji}
          />

          <WebhooksSection
            enabled={webhookEnabled}
            url={webhookUrl}
            secret={webhookSecret}
            events={webhookEvents}
            testResult={webhookTestResult}
            isTesting={testWebhook.isPending}
            onEnabledChange={setWebhookEnabled}
            onUrlChange={setWebhookUrl}
            onSecretChange={setWebhookSecret}
            onEventsChange={setWebhookEvents}
            onTest={handleTestWebhook}
          />

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-medium rounded-lg transition-colors"
            >
              {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={handleReset}
              disabled={resetSettings.isPending}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white font-medium rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
          </div>

          {(updateSettings.isSuccess || resetSettings.isSuccess) && (
            <div className="text-center text-green-400">Settings saved successfully!</div>
          )}

          {/* Version Info */}
          {versionInfo && (
            <div className="text-center pt-8 border-t border-slate-700/30">
              <p className="text-slate-500 text-sm">
                {versionInfo.name} v{versionInfo.version}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
