interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  color?: 'primary' | 'emerald'
}

export default function Toggle({ enabled, onChange, color = 'primary' }: ToggleProps) {
  const bgColor = enabled
    ? color === 'emerald'
      ? 'bg-emerald-500'
      : 'bg-primary-500'
    : 'bg-slate-600'

  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${bgColor}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-6' : ''
        }`}
      />
    </button>
  )
}
