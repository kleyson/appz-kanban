import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useUpdateCard, useDeleteCard, useCreateLabel } from '../../api/hooks'
import type { Card, Label, BoardMember, Priority, Subtask } from '../../types'
import MarkdownRenderer from './MarkdownRenderer'
import EmojiPicker from './EmojiPicker'
import { formatDateTime } from '../../utils/dateUtils'

interface CardModalProps {
  card: Card
  boardId: number
  labels: Label[]
  members: BoardMember[]
  onClose: () => void
}

interface PendingLabel {
  name: string
  color: string
}

type ModalMode = 'view' | 'edit'

const priorityOptions: { value: Priority | ''; label: string; color: string }[] = [
  { value: '', label: 'No priority', color: 'bg-slate-600' },
  { value: 'low', label: 'Low', color: 'bg-emerald-500' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
  { value: 'high', label: 'High', color: 'bg-red-500' },
]

const priorityConfig = {
  low: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Low' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Medium' },
  high: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'High' },
}

const colorOptions = [
  '#0ea5e9', // primary
  '#22c55e', // green
  '#eab308', // yellow
  '#f97316', // orange
  '#ef4444', // red
  '#a855f7', // purple
  '#ec4899', // pink
  '#6b7280', // gray
]

// Default colors for new labels
const labelColors = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#6b7280',
]

export default function CardModal({ card, boardId, labels, members, onClose }: CardModalProps) {
  const [mode, setMode] = useState<ModalMode>('view')
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [dueDate, setDueDate] = useState(card.dueDate?.slice(0, 16) || '') // Keep YYYY-MM-DDTHH:MM format
  const [priority, setPriority] = useState<Priority | ''>(card.priority || '')
  const [color, setColor] = useState(card.color || '#0ea5e9')
  const [assigneeId, setAssigneeId] = useState<number | ''>(card.assigneeId || '')
  const [selectedLabels, setSelectedLabels] = useState<number[]>(
    card.labels?.map((l) => l.id) || []
  )
  const [showLabelPicker, setShowLabelPicker] = useState(false)
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>(card.subtasks || [])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [descriptionTab, setDescriptionTab] = useState<'write' | 'preview'>('write')
  const [emojiSearch, setEmojiSearch] = useState<{
    query: string
    position: { top: number; left: number }
  } | null>(null)
  const [labelSearch, setLabelSearch] = useState('')
  const [pendingLabels, setPendingLabels] = useState<PendingLabel[]>([])
  const colorPickerRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)

  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()
  const createLabel = useCreateLabel(boardId)

  // Filter labels based on search
  const filteredLabels = useMemo(() => {
    if (!labelSearch.trim()) return labels
    return labels.filter((l) => l.name.toLowerCase().includes(labelSearch.toLowerCase()))
  }, [labels, labelSearch])

  // Check if search matches any existing label exactly
  const exactLabelMatch = useMemo(() => {
    return labels.some((l) => l.name.toLowerCase() === labelSearch.toLowerCase())
  }, [labels, labelSearch])

  // Add a new pending label
  const addPendingLabel = () => {
    if (!labelSearch.trim() || exactLabelMatch) return
    const randomColor = labelColors[Math.floor(Math.random() * labelColors.length)]
    setPendingLabels([...pendingLabels, { name: labelSearch.trim(), color: randomColor }])
    setLabelSearch('')
  }

  // Remove a pending label
  const removePendingLabel = (name: string) => {
    setPendingLabels(pendingLabels.filter((l) => l.name !== name))
  }

  // Open native color picker
  const openColorPicker = () => {
    colorPickerRef.current?.click()
  }

  // Handle emoji picker for description textarea
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    setDescription(value)

    // Check if we're typing an emoji shortcode
    const textBeforeCursor = value.substring(0, cursorPos)
    const colonMatch = textBeforeCursor.match(/:([a-zA-Z0-9_+-]*)$/)

    if (colonMatch) {
      const query = colonMatch[1]
      if (query.length >= 1) {
        setEmojiSearch({
          query,
          position: {
            top: 28,
            left: 0,
          },
        })
      } else {
        setEmojiSearch(null)
      }
    } else {
      setEmojiSearch(null)
    }
  }

  const handleEmojiSelect = (shortcode: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = description.substring(0, cursorPos)
    const textAfterCursor = description.substring(cursorPos)

    // Find the start of the emoji shortcode
    const colonIndex = textBeforeCursor.lastIndexOf(':')
    const newText = textBeforeCursor.substring(0, colonIndex) + shortcode + ' ' + textAfterCursor

    setDescription(newText)
    setEmojiSearch(null)

    // Set cursor position after the inserted emoji
    setTimeout(() => {
      const newCursorPos = colonIndex + shortcode.length + 1
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Reset form when switching modes
  const enterEditMode = () => setMode('edit')
  const cancelEdit = useCallback(() => {
    setTitle(card.title)
    setDescription(card.description || '')
    setDueDate(card.dueDate?.slice(0, 16) || '')
    setPriority(card.priority || '')
    setColor(card.color || '#0ea5e9')
    setAssigneeId(card.assigneeId || '')
    setSelectedLabels(card.labels?.map((l) => l.id) || [])
    setSubtasks(card.subtasks || [])
    setPendingLabels([])
    setLabelSearch('')
    setMode('view')
  }, [card])

  // Subtask helpers
  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return
    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false,
    }
    setSubtasks([...subtasks, newSubtask])
    setNewSubtaskTitle('')
  }

  const toggleSubtask = (id: string) => {
    const newSubtasks = subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    setSubtasks(newSubtasks)

    // Auto-save subtask toggle even in view mode
    updateCard.mutate({
      cardId: card.id,
      data: { subtasks: newSubtasks },
    })
  }

  const deleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id))
  }

  const completedCount = subtasks.filter((s) => s.completed).length
  const totalCount = subtasks.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode === 'edit') {
          cancelEdit()
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, mode, cancelEdit])

  const handleSave = async () => {
    try {
      // First, create any pending labels
      const newLabelIds: number[] = []
      for (const pending of pendingLabels) {
        const newLabel = await createLabel.mutateAsync({
          name: pending.name,
          color: pending.color,
        })
        newLabelIds.push(newLabel.id)
      }

      // Combine existing selected labels with newly created ones
      const allLabelIds = [...selectedLabels, ...newLabelIds]

      await updateCard.mutateAsync({
        cardId: card.id,
        data: {
          title,
          description: description || null,
          dueDate: dueDate || null,
          priority: priority || null,
          color,
          assigneeId: assigneeId || null,
          labelIds: allLabelIds,
          subtasks,
        },
      })
      setPendingLabels([])
      setMode('view')
    } catch (error) {
      console.error('Failed to update card:', error)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this card?')) {
      await deleteCard.mutateAsync(card.id)
      onClose()
    }
  }

  const toggleLabel = (labelId: number) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    )
  }

  const assignee = members.find((m) => m.userId === assigneeId)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-16 z-50 overflow-y-auto">
      <div
        className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50">
          <div className="flex-1 mr-4">
            {mode === 'edit' ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0"
                placeholder="Card title"
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{title}</h2>
            )}
            {mode === 'view' && card.createdAt && (
              <p className="text-sm text-slate-500 mt-1">
                Created {formatDateTime(card.createdAt)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mode === 'view' && (
              <button
                onClick={enterEditMode}
                className="px-3 py-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-colors cursor-pointer text-sm font-medium"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Labels */}
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
                      onClick={() => mode === 'edit' && toggleLabel(label.id)}
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
                    onClick={() => mode === 'edit' && removePendingLabel(pending.name)}
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
                        addPendingLabel()
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
                            toggleLabel(label.id)
                            setLabelSearch('')
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 transition-colors cursor-pointer ${
                            selectedLabels.includes(label.id)
                              ? 'bg-slate-700'
                              : 'hover:bg-slate-700'
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
                          onClick={addPendingLabel}
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
              {mode === 'edit' ? (
                <div>
                  {/* Tabs */}
                  <div className="flex border-b border-slate-700 mb-3">
                    <button
                      type="button"
                      onClick={() => setDescriptionTab('write')}
                      className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        descriptionTab === 'write'
                          ? 'text-primary-400 border-b-2 border-primary-400 -mb-px'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescriptionTab('preview')}
                      className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        descriptionTab === 'preview'
                          ? 'text-primary-400 border-b-2 border-primary-400 -mb-px'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      Preview
                    </button>
                  </div>

                  {/* Content */}
                  {descriptionTab === 'write' ? (
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={description}
                        onChange={handleDescriptionChange}
                        placeholder="Add a description... (Markdown and :emoji: supported)"
                        className="w-full h-40 px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none font-mono text-sm"
                      />
                      {emojiSearch && (
                        <EmojiPicker
                          searchQuery={emojiSearch.query}
                          position={emojiSearch.position}
                          onSelect={handleEmojiSelect}
                          onClose={() => setEmojiSearch(null)}
                        />
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Markdown supported. Type : to insert emoji
                      </p>
                    </div>
                  ) : (
                    <div className="h-40 p-4 bg-slate-900/30 border border-slate-700/30 rounded-xl overflow-y-auto">
                      <MarkdownRenderer content={description} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-900/30 border border-slate-700/30 rounded-xl min-h-[80px]">
                  <MarkdownRenderer content={description} />
                </div>
              )}
            </div>

            {/* Subtasks */}
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
                      onClick={() => toggleSubtask(subtask.id)}
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
                        onClick={() => deleteSubtask(subtask.id)}
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
                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                    placeholder="Add a subtask..."
                    className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                  <button
                    onClick={addSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className="px-3 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-56 space-y-4 flex-shrink-0">
            {/* Due date */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Due Date & Time
              </label>
              {mode === 'edit' ? (
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
                      onClick={() => setPriority(opt.value as Priority | '')}
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
                          setAssigneeId('')
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
                            setAssigneeId(member.userId)
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
                      onClick={() => setColor(c)}
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
                      onChange={(e) => setColor(e.target.value)}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700/50">
          {mode === 'edit' ? (
            <>
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
              >
                Delete Card
              </button>
              <div className="flex gap-3">
                <button
                  onClick={cancelEdit}
                  className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || updateCard.isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {updateCard.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div />
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
