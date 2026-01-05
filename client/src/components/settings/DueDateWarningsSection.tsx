import SettingsSection from './SettingsSection'

interface DueDateWarningsSectionProps {
  urgent: number
  warning: number
  approaching: number
  onUrgentChange: (value: number) => void
  onWarningChange: (value: number) => void
  onApproachingChange: (value: number) => void
}

export default function DueDateWarningsSection({
  urgent,
  warning,
  approaching,
  onUrgentChange,
  onWarningChange,
  onApproachingChange,
}: DueDateWarningsSectionProps) {
  return (
    <SettingsSection
      title="Due Date Warnings"
      description="Configure when cards should show warning colors based on time until due"
    >
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
            onChange={(e) => onUrgentChange(Number(e.target.value))}
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
            onChange={(e) => onWarningChange(Number(e.target.value))}
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
            onChange={(e) => onApproachingChange(Number(e.target.value))}
            className="w-full accent-yellow-500"
          />
        </div>
      </div>
    </SettingsSection>
  )
}
