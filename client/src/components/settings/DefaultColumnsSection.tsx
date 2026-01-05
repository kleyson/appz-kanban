import SettingsSection from './SettingsSection'

interface DefaultColumnsSectionProps {
  defaultColumns: string
  onDefaultColumnsChange: (value: string) => void
}

export default function DefaultColumnsSection({
  defaultColumns,
  onDefaultColumnsChange,
}: DefaultColumnsSectionProps) {
  return (
    <SettingsSection
      title="Default Columns"
      description="Comma-separated list of columns to create for new boards"
    >
      <input
        type="text"
        value={defaultColumns}
        onChange={(e) => onDefaultColumnsChange(e.target.value)}
        placeholder="To Do, In Progress, Done"
        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      />
    </SettingsSection>
  )
}
