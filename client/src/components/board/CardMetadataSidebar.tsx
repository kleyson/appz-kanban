import { useState, useRef } from 'react'
import type { Priority, BoardMember } from '../../types'
import { priorityOptions, priorityConfig, colorOptions } from './cardModalHelpers'

interface CardMetadataSidebarProps {
  dueDate: string
  priority: Priority | ''
  assigneeId: number | ''
  color: string
  members: BoardMember[]
  mode: 'view' | 'edit'
  onDueDateChange: (value: string) => void
  onPriorityChange: (value: Priority | '') => void
  onAssigneeChange: (value: number | '') => void
  onColorChange: (value: string) => void
}

export default function CardMetadataSidebar({
  dueDate,
  priority,
  assigneeId,
  color,
  members,
  mode,
  onDueDateChange,
  onPriorityChange,
  onAssigneeChange,
  onColorChange,
}: CardMetadataSidebarProps) {
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const colorPickerRef = useRef<HTMLInputElement>(null)

  const assignee = members.find((m) => m.userId === assigneeId)

  const openColorPicker = () => {
    colorPickerRef.current?.click()
  }

  return (
    <div className="lg:w-56 space-y-4 flex-shrink-0">
      {/* Due date */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">Due Date & Time</label>
        {mode === 'edit' ? (
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 [color-scheme:dark]"
          />
        ) : (
          <p className="text-white">
            {dueDate ? (
              new Date(dueDate).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            ) : (
              <span className="text-slate-500">Not set</span>
            )}
          </p>
        )}
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">Priority</label>
        {mode === 'edit' ? (
          <div className="grid grid-cols-4 gap-1">
            {priorityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPriorityChange(opt.value as Priority | '')}
                className={`py-2 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  priority === opt.value
                    ? opt.value === ''
                      ? 'bg-slate-600 text-white ring-1 ring-slate-400'
                      : opt.value === 'low'
                        ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400'
                        : opt.value === 'medium'
                          ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-400'
                          : 'bg-red-500/30 text-red-300 ring-1 ring-red-400'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {opt.value === '' ? '—' : opt.value === 'medium' ? 'Med' : opt.label}
              </button>
            ))}
          </div>
        ) : (
          <p>
            {priority ? (
              <span
                className={`px-2 py-1 rounded-md font-medium text-sm ${priorityConfig[priority].bg} ${priorityConfig[priority].text}`}
              >
                {priorityConfig[priority].label}
              </span>
            ) : (
              <span className="text-slate-500">Not set</span>
            )}
          </p>
        )}
      </div>

      {/* Assignee */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">Assignee</label>
        {mode === 'edit' ? (
          <div className="relative">
            <button
              onClick={() => setShowMemberPicker(!showMemberPicker)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-left hover:border-slate-500/50 transition-colors cursor-pointer"
            >
              {assigneeId ? (
                <>
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {assignee?.user?.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white">{assignee?.user?.displayName}</span>
                </>
              ) : (
                <span className="text-slate-500">Unassigned</span>
              )}
            </button>
            {showMemberPicker && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden">
                <button
                  onClick={() => {
                    onAssigneeChange('')
                    setShowMemberPicker(false)
                  }}
                  className="w-full px-4 py-3 text-left text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Unassigned
                </button>
                {members.map((member) => (
                  <button
                    key={member.userId}
                    onClick={() => {
                      onAssigneeChange(member.userId)
                      setShowMemberPicker(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {member.user?.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white">{member.user?.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {assignee ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {assignee.user?.displayName?.charAt(0).toUpperCase()}
                </div>
                <span className="text-white">{assignee.user?.displayName}</span>
              </div>
            ) : (
              <span className="text-slate-500">Unassigned</span>
            )}
          </div>
        )}
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">Card Color</label>
        {mode === 'edit' ? (
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((c) => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                className={`w-7 h-7 rounded-lg transition-all cursor-pointer ${
                  color === c
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-800'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            {/* Custom color picker */}
            <div className="relative">
              <input
                ref={colorPickerRef}
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="absolute inset-0 w-7 h-7 opacity-0 cursor-pointer"
              />
              <button
                onClick={openColorPicker}
                className={`w-7 h-7 rounded-lg border-2 border-dashed border-slate-500 flex items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-300 transition-all cursor-pointer ${
                  !colorOptions.includes(color)
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-800 border-solid'
                    : ''
                }`}
                style={
                  !colorOptions.includes(color)
                    ? { backgroundColor: color, borderColor: color }
                    : {}
                }
              >
                {colorOptions.includes(color) && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: color }} />
        )}
      </div>
    </div>
  )
}
