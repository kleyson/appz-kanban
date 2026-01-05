import type { ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
  headerRight?: ReactNode
}

export default function SettingsSection({
  title,
  description,
  children,
  headerRight,
}: SettingsSectionProps) {
  return (
    <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {headerRight}
      </div>
      {description && <p className="text-slate-400 text-sm mb-6">{description}</p>}
      {children}
    </section>
  )
}
