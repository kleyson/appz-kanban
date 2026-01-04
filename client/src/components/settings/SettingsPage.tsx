import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../../stores/settingsStore'
import { useUpdateSettings, useResetSettings, useVersion, useTestWebhook } from '../../api/hooks'
import type { WebhookEvent } from '../../types'

const WEBHOOK_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: 'card.created', label: 'Card Created' },
  { value: 'card.updated', label: 'Card Updated' },
  { value: 'card.moved', label: 'Card Moved' },
  { value: 'card.deleted', label: 'Card Deleted' },
  { value: 'column.created', label: 'Column Created' },
  { value: 'column.deleted', label: 'Column Deleted' },
  { value: 'board.created', label: 'Board Created' },
  { value: 'label.created', label: 'Label Created' },
]

export function SettingsPage() {
  const navigate = useNavigate()
  const { settings, addCustomEmoji, removeCustomEmoji } = useSettingsStore()
  const updateSettings = useUpdateSettings()
  const resetSettings = useResetSettings()
  const { data: versionInfo } = useVersion()
  const testWebhook = useTestWebhook()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [defaultDueDays, setDefaultDueDays] = useState(settings.defaultDueDays)
  const [defaultColumns, setDefaultColumns] = useState(settings.defaultColumns.join(', '))
  const [urgent, setUrgent] = useState(settings.dueDateWarnings.urgent)
  const [warning, setWarning] = useState(settings.dueDateWarnings.warning)
  const [approaching, setApproaching] = useState(settings.dueDateWarnings.approaching)
  const [autoRefresh, setAutoRefresh] = useState(settings.fullscreen.autoRefreshInterval)
  const [showClock, setShowClock] = useState(settings.fullscreen.showClock)
  const [rottingEnabled, setRottingEnabled] = useState(settings.cardRotting?.enabled ?? true)
  const [rottingSlight, setRottingSlight] = useState(settings.cardRotting?.thresholds?.slight ?? 3)
  const [rottingMedium, setRottingMedium] = useState(settings.cardRotting?.thresholds?.medium ?? 7)
  const [rottingHeavy, setRottingHeavy] = useState(settings.cardRotting?.thresholds?.heavy ?? 14)
  const [webhookEnabled, setWebhookEnabled] = useState(settings.webhook?.enabled ?? false)
  const [webhookUrl, setWebhookUrl] = useState(settings.webhook?.url ?? '')
  const [webhookSecret, setWebhookSecret] = useState(settings.webhook?.secret ?? '')
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>(settings.webhook?.events ?? [])
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success: boolean
    error?: string
  } | null>(null)
  const [newEmojiName, setNewEmojiName] = useState('')
  const [newEmojiShortcode, setNewEmojiShortcode] = useState('')
  const [newEmojiPreview, setNewEmojiPreview] = useState<string | null>(null)

  const handleEmojiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 100KB)
    if (file.size > 100 * 1024) {
      alert('Emoji image must be less than 100KB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setNewEmojiPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAddEmoji = () => {
    if (!newEmojiName.trim() || !newEmojiShortcode.trim() || !newEmojiPreview) {
      alert('Please fill in all fields and select an image')
      return
    }

    // Format shortcode
    let shortcode = newEmojiShortcode.trim().toLowerCase()
    if (!shortcode.startsWith(':')) shortcode = ':' + shortcode
    if (!shortcode.endsWith(':')) shortcode = shortcode + ':'

    // Check for duplicate shortcode
    if (settings.customEmojis.some((e) => e.shortcode === shortcode)) {
      alert('An emoji with this shortcode already exists')
      return
    }

    addCustomEmoji({
      shortcode,
      name: newEmojiName.trim(),
      imageData: newEmojiPreview,
    })

    // Reset form
    setNewEmojiName('')
    setNewEmojiShortcode('')
    setNewEmojiPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteEmoji = (shortcode: string) => {
    if (confirm(`Delete emoji ${shortcode}?`)) {
      removeCustomEmoji(shortcode)
    }
  }

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

  const toggleWebhookEvent = (event: WebhookEvent) => {
    setWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
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
          {/* Default Due Date */}
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Default Due Date</h2>
            <p className="text-slate-400 text-sm mb-4">
              Number of days from card creation for the default due date
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="14"
                value={defaultDueDays}
                onChange={(e) => setDefaultDueDays(Number(e.target.value))}
                className="flex-1 accent-primary-500"
              />
              <span className="text-white font-medium w-16 text-center">
                {defaultDueDays} day{defaultDueDays > 1 ? 's' : ''}
              </span>
            </div>
          </section>

          {/* Default Columns */}
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Default Columns</h2>
            <p className="text-slate-400 text-sm mb-4">
              Comma-separated list of columns to create for new boards
            </p>
            <input
              type="text"
              value={defaultColumns}
              onChange={(e) => setDefaultColumns(e.target.value)}
              placeholder="To Do, In Progress, Done"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </section>

          {/* Due Date Warnings */}
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Due Date Warnings</h2>
            <p className="text-slate-400 text-sm mb-6">
              Configure when cards should show warning colors based on time until due
            </p>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-red-400 font-medium flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    Urgent
                  </label>
                  <span className="text-slate-400">
                    {urgent} hour{urgent > 1 ? 's' : ''}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={urgent}
                  onChange={(e) => setUrgent(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-orange-400 font-medium flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    Warning
                  </label>
                  <span className="text-slate-400">{warning} hours</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="72"
                  step="6"
                  value={warning}
                  onChange={(e) => setWarning(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-yellow-400 font-medium flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    Approaching
                  </label>
                  <span className="text-slate-400">
                    {approaching} hours ({Math.round(approaching / 24)} days)
                  </span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="168"
                  step="12"
                  value={approaching}
                  onChange={(e) => setApproaching(Number(e.target.value))}
                  className="w-full accent-yellow-500"
                />
              </div>
            </div>
          </section>

          {/* Fullscreen Mode */}
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Fullscreen Mode</h2>
            <p className="text-slate-400 text-sm mb-6">
              Settings for the always-on tablet display mode
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white">Auto-refresh interval</label>
                  <span className="text-slate-400">{autoRefresh} seconds</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="10"
                  value={autoRefresh}
                  onChange={(e) => setAutoRefresh(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-white">Show clock</span>
                <button
                  onClick={() => setShowClock(!showClock)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    showClock ? 'bg-primary-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      showClock ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </label>
            </div>
          </section>

          {/* Card Rotting Effect */}
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Card Rotting Effect</h2>
              <button
                onClick={() => setRottingEnabled(!rottingEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                  rottingEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    rottingEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Cards that stay too long in the same column will visually "rot" - becoming desaturated
              and showing mold-like spots. This helps identify stale tasks that need attention.
            </p>

            <div className={`space-y-6 ${!rottingEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Preview */}
              <div className="flex gap-4 justify-center mb-6">
                <div className="text-center">
                  <div className="w-16 h-20 bg-slate-700 rounded-lg mb-2" />
                  <span className="text-xs text-slate-400">Fresh</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-20 bg-slate-700 rounded-lg mb-2 saturate-[0.85] brightness-95 border border-emerald-900/30">
                    <div
                      className="absolute w-1 h-1 bg-emerald-900/40 rounded-full blur-sm"
                      style={{ top: '30%', left: '60%' }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">Slight</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-20 bg-slate-700 rounded-lg mb-2 saturate-[0.6] brightness-90 border border-emerald-900/30" />
                  <span className="text-xs text-slate-400">Medium</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-20 bg-slate-700 rounded-lg mb-2 saturate-[0.3] brightness-75 border border-emerald-900/30" />
                  <span className="text-xs text-slate-400">Heavy</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-emerald-300 font-medium flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-800 rounded-full"></span>
                    Slight rot
                  </label>
                  <span className="text-slate-400">{rottingSlight} days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={rottingSlight}
                  onChange={(e) => setRottingSlight(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-emerald-400 font-medium flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-700 rounded-full"></span>
                    Medium rot
                  </label>
                  <span className="text-slate-400">{rottingMedium} days</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="14"
                  value={rottingMedium}
                  onChange={(e) => setRottingMedium(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-emerald-500 font-medium flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-600 rounded-full"></span>
                    Heavy rot
                  </label>
                  <span className="text-slate-400">{rottingHeavy} days</span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="30"
                  value={rottingHeavy}
                  onChange={(e) => setRottingHeavy(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </section>

          {/* Custom Emojis */}
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Custom Emojis</h2>
            <p className="text-slate-400 text-sm mb-6">
              Add custom emojis to use in card descriptions with shortcodes like :shortcode:
            </p>

            {/* Existing emojis */}
            {settings.customEmojis.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Your Custom Emojis</h3>
                <div className="flex flex-wrap gap-3">
                  {settings.customEmojis.map((emoji) => (
                    <div
                      key={emoji.shortcode}
                      className="group relative flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg"
                    >
                      <img
                        src={emoji.imageData}
                        alt={emoji.name}
                        className="w-6 h-6 object-contain"
                      />
                      <div className="text-sm">
                        <span className="text-white">{emoji.name}</span>
                        <span className="text-slate-500 ml-2">{emoji.shortcode}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteEmoji(emoji.shortcode)}
                        className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center text-xs transition-opacity cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new emoji form */}
            <div className="space-y-4 p-4 bg-slate-900/30 border border-slate-700/30 rounded-lg">
              <h3 className="text-sm font-medium text-white">Add New Emoji</h3>

              <div className="flex gap-4">
                {/* Preview */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-slate-800 border border-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                    {newEmojiPreview ? (
                      <img
                        src={newEmojiPreview}
                        alt="Preview"
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <span className="text-slate-500 text-2xl">?</span>
                    )}
                  </div>
                </div>

                {/* Form fields */}
                <div className="flex-1 space-y-3">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleEmojiFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors cursor-pointer"
                    >
                      Choose Image
                    </button>
                    <span className="text-slate-500 text-xs ml-3">Max 100KB, PNG/JPG/GIF</span>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newEmojiName}
                      onChange={(e) => setNewEmojiName(e.target.value)}
                      placeholder="Name (e.g., Kanban Logo)"
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                    <input
                      type="text"
                      value={newEmojiShortcode}
                      onChange={(e) => setNewEmojiShortcode(e.target.value)}
                      placeholder="Shortcode (e.g., kanban)"
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddEmoji}
                disabled={!newEmojiPreview || !newEmojiName || !newEmojiShortcode}
                className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Add Emoji
              </button>
            </div>
          </section>

          {/* Webhook Settings */}
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Webhooks</h2>
              <button
                onClick={() => setWebhookEnabled(!webhookEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                  webhookEnabled ? 'bg-primary-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    webhookEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Send HTTP POST requests to your server when actions occur. Useful for integrations
              with other tools like Slack, Discord, or custom automation.
            </p>

            <div className={`space-y-4 ${!webhookEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
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
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
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
                      onClick={() => toggleWebhookEvent(event.value)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                        webhookEvents.includes(event.value)
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
                  onClick={handleTestWebhook}
                  disabled={!webhookUrl || testWebhook.isPending}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {testWebhook.isPending ? 'Testing...' : 'Test Webhook'}
                </button>

                {webhookTestResult && (
                  <div
                    className={`mt-3 px-4 py-2 rounded-lg text-sm ${
                      webhookTestResult.success
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {webhookTestResult.success
                      ? 'Webhook test successful!'
                      : `Test failed: ${webhookTestResult.error}`}
                  </div>
                )}
              </div>
            </div>
          </section>

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
