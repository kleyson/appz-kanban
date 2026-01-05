import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '../../types'
import { useSettingsStore } from '../../stores/settingsStore'
import {
  getDueDateWarningLevel,
  formatRelativeDate,
  getWarningClasses,
  getWarningBackground,
  getRotLevel,
  getRotClasses,
  getRotOverlay,
} from '../../utils/dateUtils'
import { parseEmojis, getMarkdownPreview } from '../../utils/markdown'
import {
  priorityConfig,
  getProgressColor,
  generateMoldSpots,
  calculateSubtaskProgress,
} from './helpers'

interface KanbanCardProps {
  card: Card
  isDragging?: boolean
  onClick?: () => void
}

export default function KanbanCard({ card, isDragging, onClick }: KanbanCardProps) {
  const { settings } = useSettingsStore()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isBeingDragged = isDragging || isSortableDragging
  const cardColor = card.color || '#0ea5e9'

  // Calculate subtask progress
  const subtasks = card.subtasks || []
  const {
    completed: completedSubtasks,
    total: totalSubtasks,
    percent: progressPercent,
  } = calculateSubtaskProgress(subtasks)

  // Get due date warning level
  const warningLevel = getDueDateWarningLevel(card.dueDate, settings.dueDateWarnings)
  const warningClasses = getWarningClasses(warningLevel)
  const warningBackground = getWarningBackground(warningLevel)

  // Get rot level for stale cards
  const rotLevel = getRotLevel(card.updatedAt, settings.cardRotting)
  const rotClasses = getRotClasses(rotLevel)
  const rotOverlay = getRotOverlay(rotLevel)

  // Parse emojis in title and description
  const titleWithEmoji = useMemo(
    () => parseEmojis(card.title, settings.customEmojis),
    [card.title, settings.customEmojis]
  )
  const descriptionPreview = useMemo(
    () => parseEmojis(getMarkdownPreview(card.description || '', 80), settings.customEmojis),
    [card.description, settings.customEmojis]
  )

  // Generate mold spots for rot effect
  const moldSpots = useMemo(() => {
    const spots = generateMoldSpots(rotOverlay.spots, rotOverlay.opacity)
    if (spots.length === 0) return null
    return spots.map((spot) => (
      <div
        key={spot.id}
        className="absolute rounded-full bg-emerald-900/60 blur-sm pointer-events-none"
        style={{
          width: `${spot.size}px`,
          height: `${spot.size}px`,
          top: `${spot.top}%`,
          left: `${spot.left}%`,
          opacity: spot.opacity,
        }}
      />
    ))
  }, [rotOverlay.spots, rotOverlay.opacity])

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        group relative overflow-hidden
        bg-slate-800/70 backdrop-blur-sm border border-slate-700/50
        rounded-xl cursor-pointer
        hover:border-slate-600/50 hover:bg-slate-800/90 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5
        transition-all duration-200
        ${warningClasses}
        ${warningBackground}
        ${rotClasses}
        ${rotLevel !== 'none' ? 'border-emerald-900/30' : ''}
        ${isBeingDragged ? 'opacity-90 shadow-2xl shadow-primary-500/20 scale-[1.02] rotate-1' : ''}
      `}
    >
      {/* Mold overlay for rotting cards */}
      {moldSpots}
      {/* Progress bar at top */}
      {totalSubtasks > 0 && (
        <div className="h-1 bg-slate-700/50">
          <div
            className={`h-full ${getProgressColor(progressPercent)} transition-all duration-300`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="p-4">
        {/* Color accent */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: cardColor }}
        />

        {/* Title */}
        <h4
          className="text-white font-medium mb-1.5 pl-3 pr-8 leading-snug line-clamp-2 [&_.inline-emoji]:inline-block [&_.inline-emoji]:w-4 [&_.inline-emoji]:h-4 [&_.inline-emoji]:align-text-bottom"
          dangerouslySetInnerHTML={{ __html: titleWithEmoji }}
        />

        {/* Description preview */}
        {card.description && (
          <p
            className="text-slate-400 text-sm mb-3 pl-3 pr-2 line-clamp-1 [&_.inline-emoji]:inline-block [&_.inline-emoji]:w-3.5 [&_.inline-emoji]:h-3.5 [&_.inline-emoji]:align-text-bottom"
            dangerouslySetInnerHTML={{ __html: descriptionPreview }}
          />
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-2 pl-3 flex-wrap text-xs">
          {/* Subtask count */}
          {totalSubtasks > 0 && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                progressPercent === 100
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700/50 text-slate-400'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}

          {/* Due date */}
          {card.dueDate && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                warningLevel === 'overdue'
                  ? 'bg-red-500/20 text-red-400'
                  : warningLevel === 'urgent'
                    ? 'bg-red-500/15 text-red-300'
                    : warningLevel === 'warning'
                      ? 'bg-orange-500/15 text-orange-300'
                      : warningLevel === 'approaching'
                        ? 'bg-yellow-500/10 text-yellow-300'
                        : 'bg-slate-700/50 text-slate-400'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatRelativeDate(card.dueDate)}</span>
            </div>
          )}

          {/* Priority */}
          {card.priority && (
            <span
              className={`px-2 py-1 rounded-md font-medium ${priorityConfig[card.priority].bg} ${priorityConfig[card.priority].text}`}
            >
              {priorityConfig[card.priority].label}
            </span>
          )}
        </div>

        {/* Labels row */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 pl-3">
            {card.labels.slice(0, 3).map((label) => (
              <span
                key={label.id}
                className="w-5 h-2 rounded-full"
                style={{ backgroundColor: label.color }}
                title={label.name}
              />
            ))}
            {card.labels.length > 3 && (
              <span className="text-slate-500 text-xs">+{card.labels.length - 3}</span>
            )}
          </div>
        )}

        {/* Assignee - positioned bottom right */}
        {card.assignee && (
          <div
            className="absolute bottom-3 right-3 w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-md"
            title={card.assignee.displayName}
          >
            {card.assignee.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}
