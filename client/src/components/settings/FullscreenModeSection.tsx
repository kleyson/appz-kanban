import SettingsSection from './SettingsSection'
import Toggle from './Toggle'

interface FullscreenModeSectionProps {
  autoRefresh: number
  showClock: boolean
  onAutoRefreshChange: (value: number) => void
  onShowClockChange: (value: boolean) => void
}

export default function FullscreenModeSection({
  autoRefresh,
  showClock,
  onAutoRefreshChange,
  onShowClockChange,
}: FullscreenModeSectionProps) {
  return (
    <SettingsSection
      title="Fullscreen Mode"
      description="Settings for the always-on tablet display mode"
    >
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
            onChange={(e) => onAutoRefreshChange(Number(e.target.value))}
            className="w-full accent-primary-500"
          />
        </div>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-white">Show clock</span>
          <Toggle enabled={showClock} onChange={onShowClockChange} />
        </label>
      </div>
    </SettingsSection>
  )
}
