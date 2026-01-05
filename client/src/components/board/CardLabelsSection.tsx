import { useState, useMemo, useRef } from 'react'
import type { Label } from '../../types'
import { PendingLabel, getRandomLabelColor } from './cardModalHelpers'

interface CardLabelsSectionProps {
  labels: Label[]
  selectedLabels: number[]
  pendingLabels: PendingLabel[]
  mode: 'view' | 'edit'
  onToggleLabel: (labelId: number) => void
  onAddPendingLabel: (label: PendingLabel) => void
  onRemovePendingLabel: (name: string) => void
}

export default function CardLabelsSection({
  labels,
  selectedLabels,
  pendingLabels,
  mode,
  onToggleLabel,
  onAddPendingLabel,
  onRemovePendingLabel,
}: CardLabelsSectionProps) {
  const [labelSearch, setLabelSearch] = useState('')
  const [showLabelPicker, setShowLabelPicker] = useState(false)
  const labelInputRef = useRef<HTMLInputElement>(null)

  const filteredLabels = useMemo(() => {
    if (!labelSearch.trim()) return labels
    return labels.filter((l) => l.name.toLowerCase().includes(labelSearch.toLowerCase()))
  }, [labels, labelSearch])

  const exactLabelMatch = useMemo(() => {
    return labels.some((l) => l.name.toLowerCase() === labelSearch.toLowerCase())
  }, [labels, labelSearch])

  const handleAddPendingLabel = () => {
    if (!labelSearch.trim() || exactLabelMatch) return
    onAddPendingLabel({ name: labelSearch.trim(), color: getRandomLabelColor() })
    setLabelSearch('')
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-2">Labels</label>
      {/* Selected labels */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedLabels.map((labelId) => {
          const label = labels.find((l) => l.id === labelId)
          if (!label) return null
          return (
            <span
              key={label.id}
              className={`px-3 py-1 rounded-full text-sm font-medium text-white ${mode === 'edit' ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
              style={{ backgroundColor: label.color }}
              onClick={() => mode === 'edit' && onToggleLabel(label.id)}
            >
              {label.name} {mode === 'edit' && '×'}
            </span>
          )
        })}
        {/* Pending labels (to be created) */}
        {pendingLabels.map((pending) => (
          <span
            key={pending.name}
            className="px-3 py-1 rounded-full text-sm font-medium text-white cursor-pointer hover:opacity-80 transition-opacity border-2 border-dashed border-white/30"
            style={{ backgroundColor: pending.color }}
            onClick={() => mode === 'edit' && onRemovePendingLabel(pending.name)}
          >
            {pending.name} ×
          </span>
        ))}
        {selectedLabels.length === 0 && pendingLabels.length === 0 && mode === 'view' && (
          <span className="text-slate-500 text-sm">No labels</span>
        )}
      </div>

      {/* Label input (edit mode) */}
      {mode === 'edit' && (
        <div className="relative">
          <input
            ref={labelInputRef}
            type="text"
            value={labelSearch}
            onChange={(e) => {
              setLabelSearch(e.target.value)
              setShowLabelPicker(true)
            }}
            onFocus={() => setShowLabelPicker(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && labelSearch.trim() && !exactLabelMatch) {
                e.preventDefault()
                handleAddPendingLabel()
              }
            }}
            placeholder="Search or create label..."
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          {showLabelPicker && (labelSearch || labels.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
              {filteredLabels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => {
                    onToggleLabel(label.id)
                    setLabelSearch('')
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 transition-colors cursor-pointer ${
                    selectedLabels.includes(label.id) ? 'bg-slate-700' : 'hover:bg-slate-700'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-white text-sm">{label.name}</span>
                  {selectedLabels.includes(label.id) && (
                    <svg
                      className="w-4 h-4 text-primary-400 ml-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
              {labelSearch.trim() && !exactLabelMatch && (
                <button
                  onClick={handleAddPendingLabel}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700 transition-colors cursor-pointer border-t border-slate-700"
                >
                  <svg
                    className="w-4 h-4 text-primary-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-primary-400 text-sm">Create "{labelSearch}"</span>
                </button>
              )}
              {filteredLabels.length === 0 && !labelSearch.trim() && (
                <p className="text-slate-500 text-sm text-center py-3">No labels yet</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
