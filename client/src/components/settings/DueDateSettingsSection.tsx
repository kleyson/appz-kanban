import SettingsSection from './SettingsSection'

interface DueDateSettingsSectionProps {
  defaultDueDays: number
  onDefaultDueDaysChange: (value: number) => void
}

export default function DueDateSettingsSection({
  defaultDueDays,
  onDefaultDueDaysChange,
}: DueDateSettingsSectionProps) {
  return (
    <SettingsSection
      title="Default Due Date"
      description="Number of days from card creation for the default due date"
    >
      <div className="flex items-center gap-4">
        <input
          type="range"
          min="1"
          max="14"
          value={defaultDueDays}
          onChange={(e) => onDefaultDueDaysChange(Number(e.target.value))}
          className="flex-1 accent-primary-500"
        />
        <span className="text-white font-medium w-16 text-center">
          {defaultDueDays} day{defaultDueDays > 1 ? 's' : ''}
        </span>
      </div>
    </SettingsSection>
  )
}
