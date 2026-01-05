import type { WebhookEvent } from '../../types'
import SettingsSection from './SettingsSection'
import Toggle from './Toggle'
import { WEBHOOK_EVENTS, toggleWebhookEvent } from './settingsHelpers'

interface WebhooksSectionProps {
  enabled: boolean
  url: string
  secret: string
  events: WebhookEvent[]
  testResult: { success: boolean; error?: string } | null
  isTesting: boolean
  onEnabledChange: (value: boolean) => void
  onUrlChange: (value: string) => void
  onSecretChange: (value: string) => void
  onEventsChange: (events: WebhookEvent[]) => void
  onTest: () => void
}

export default function WebhooksSection({
  enabled,
  url,
  secret,
  events,
  testResult,
  isTesting,
  onEnabledChange,
  onUrlChange,
  onSecretChange,
  onEventsChange,
  onTest,
}: WebhooksSectionProps) {
  return (
    <SettingsSection
      title="Webhooks"
      description="Send HTTP POST requests to your server when actions occur. Useful for integrations with other tools like Slack, Discord, or custom automation."
      headerRight={<Toggle enabled={enabled} onChange={onEnabledChange} />}
    >
      <div className={`space-y-4 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Webhook URL */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Webhook URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>

        {/* Webhook Secret */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Secret (for HMAC signature)
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => onSecretChange(e.target.value)}
            placeholder="Optional secret for signature verification"
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          <p className="text-slate-500 text-xs mt-1">
            If set, requests will include X-Kanban-Signature header with HMAC-SHA256
          </p>
        </div>

        {/* Events */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">Events to send</label>
          <div className="grid grid-cols-2 gap-2">
            {WEBHOOK_EVENTS.map((event) => (
              <button
                key={event.value}
                onClick={() => onEventsChange(toggleWebhookEvent(events, event.value))}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                  events.includes(event.value)
                    ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                    : 'bg-slate-900/50 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                {event.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test Webhook */}
        <div className="pt-4 border-t border-slate-700/50">
          <button
            onClick={onTest}
            disabled={!url || isTesting}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isTesting ? 'Testing...' : 'Test Webhook'}
          </button>

          {testResult && (
            <div
              className={`mt-3 px-4 py-2 rounded-lg text-sm ${
                testResult.success
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {testResult.success
                ? 'Webhook test successful!'
                : `Test failed: ${testResult.error}`}
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  )
}
