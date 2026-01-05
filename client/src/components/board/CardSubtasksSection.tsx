import { useState } from 'react'
import type { Subtask } from '../../types'
import { createSubtask, calculateProgress } from './cardModalHelpers'

interface CardSubtasksSectionProps {
  subtasks: Subtask[]
  mode: 'view' | 'edit'
  onToggleSubtask: (id: string) => void
  onAddSubtask: (subtask: Subtask) => void
  onDeleteSubtask: (id: string) => void
}

export default function CardSubtasksSection({
  subtasks,
  mode,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}: CardSubtasksSectionProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const { completed: completedCount, total: totalCount, percent: progressPercent } =
    calculateProgress(subtasks)

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return
    onAddSubtask(createSubtask(newSubtaskTitle))
    setNewSubtaskTitle('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-400">
          Subtasks {totalCount > 0 && `(${completedCount}/${totalCount})`}
        </label>
        {totalCount > 0 && (
          <span
            className={`text-xs ${progressPercent === 100 ? 'text-emerald-400' : 'text-slate-500'}`}
          >
            {Math.round(progressPercent)}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1.5 bg-slate-700/50 rounded-full mb-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progressPercent === 100 ? 'bg-emerald-500' : 'bg-primary-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-2 mb-3">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="group flex items-center gap-3 px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg hover:border-slate-600/50 transition-colors"
          >
            <button
              onClick={() => onToggleSubtask(subtask.id)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${
                subtask.completed
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-500 hover:border-slate-400'
              }`}
            >
              {subtask.completed && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
            <span
              className={`flex-1 text-sm ${subtask.completed ? 'text-slate-500 line-through' : 'text-white'}`}
            >
              {subtask.title}
            </span>
            {mode === 'edit' && (
              <button
                onClick={() => onDeleteSubtask(subtask.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
        {subtasks.length === 0 && mode === 'view' && (
          <p className="text-slate-500 text-sm">No subtasks</p>
        )}
      </div>

      {/* Add subtask input - only in edit mode */}
      {mode === 'edit' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
            placeholder="Add a subtask..."
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          <button
            onClick={handleAddSubtask}
            disabled={!newSubtaskTitle.trim()}
            className="px-3 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}
