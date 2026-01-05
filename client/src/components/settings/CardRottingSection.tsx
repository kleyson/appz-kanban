import SettingsSection from './SettingsSection'
import Toggle from './Toggle'

interface CardRottingSectionProps {
  enabled: boolean
  slight: number
  medium: number
  heavy: number
  onEnabledChange: (value: boolean) => void
  onSlightChange: (value: number) => void
  onMediumChange: (value: number) => void
  onHeavyChange: (value: number) => void
}

export default function CardRottingSection({
  enabled,
  slight,
  medium,
  heavy,
  onEnabledChange,
  onSlightChange,
  onMediumChange,
  onHeavyChange,
}: CardRottingSectionProps) {
  return (
    <SettingsSection
      title="Card Rotting Effect"
      description="Cards that stay too long in the same column will visually 'rot' - becoming desaturated and showing mold-like spots. This helps identify stale tasks that need attention."
      headerRight={<Toggle enabled={enabled} onChange={onEnabledChange} color="emerald" />}
    >
      <div className={`space-y-6 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
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
            <span className="text-slate-400">{slight} days</span>
          </div>
          <input
            type="range"
            min="1"
            max="7"
            value={slight}
            onChange={(e) => onSlightChange(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-emerald-400 font-medium flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-700 rounded-full"></span>
              Medium rot
            </label>
            <span className="text-slate-400">{medium} days</span>
          </div>
          <input
            type="range"
            min="3"
            max="14"
            value={medium}
            onChange={(e) => onMediumChange(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-emerald-500 font-medium flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-600 rounded-full"></span>
              Heavy rot
            </label>
            <span className="text-slate-400">{heavy} days</span>
          </div>
          <input
            type="range"
            min="7"
            max="30"
            value={heavy}
            onChange={(e) => onHeavyChange(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>
    </SettingsSection>
  )
}
