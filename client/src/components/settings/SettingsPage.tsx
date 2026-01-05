import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAuthStore } from '../../stores/authStore'
import { useVersion } from '../../api/hooks'
import { useSettingsForm } from '../../hooks/useSettingsForm'
import InviteManagement from './InviteManagement'
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
  const { data: versionInfo } = useVersion()

  const {
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
    isSaving,
    isResetting,
    isTesting,
    saveSuccess,
    resetSuccess,
  } = useSettingsForm()

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
            isTesting={isTesting}
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
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-medium rounded-lg transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white font-medium rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
          </div>

          {(saveSuccess || resetSuccess) && (
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
