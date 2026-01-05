import type { DueDateWarnings, DueDateWarningLevel, CardRottingSettings, RotLevel } from '../types'

/**
 * Calculate hours until a due date
 */
export function hoursUntilDue(dueDate: string): number {
  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  return diffMs / (1000 * 60 * 60)
}

/**
 * Get the warning level for a due date based on settings
 */
export function getDueDateWarningLevel(
  dueDate: string | null,
  warnings: DueDateWarnings
): DueDateWarningLevel {
  if (!dueDate) return 'normal'

  const hours = hoursUntilDue(dueDate)

  if (hours < 0) return 'overdue'
  if (hours <= warnings.urgent) return 'urgent'
  if (hours <= warnings.warning) return 'warning'
  if (hours <= warnings.approaching) return 'approaching'
  return 'normal'
}

/**
 * Get CSS classes for a warning level
 */
export function getWarningClasses(level: DueDateWarningLevel): string {
  switch (level) {
    case 'overdue':
      return 'animate-pulse-overdue ring-2 ring-red-500/50'
    case 'urgent':
      return 'animate-pulse-urgent ring-2 ring-red-400/40'
    case 'warning':
      return 'animate-pulse-warning ring-1 ring-orange-400/30'
    case 'approaching':
      return 'ring-1 ring-yellow-400/20'
    default:
      return ''
  }
}

/**
 * Get background color for a warning level
 */
export function getWarningBackground(level: DueDateWarningLevel): string {
  switch (level) {
    case 'overdue':
      return 'bg-red-950/30'
    case 'urgent':
      return 'bg-red-900/20'
    case 'warning':
      return 'bg-orange-900/15'
    case 'approaching':
      return 'bg-yellow-900/10'
    default:
      return ''
  }
}

/**
 * Format a date as a relative string
 */
export function formatRelativeDate(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = date.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffHours / 24

  // Past dates
  if (diffMs < 0) {
    const absDays = Math.abs(diffDays)
    if (absDays < 1) {
      const absHours = Math.abs(diffHours)
      if (absHours < 1) {
        return 'Overdue'
      }
      return `${Math.ceil(absHours)}h overdue`
    }
    if (absDays < 7) {
      return `${Math.ceil(absDays)}d overdue`
    }
    return `${Math.ceil(absDays / 7)}w overdue`
  }

  // Future dates
  if (diffHours < 1) {
    return 'Due soon'
  }
  if (diffHours < 24) {
    return `In ${Math.ceil(diffHours)}h`
  }
  if (diffDays < 2) {
    return 'Tomorrow'
  }
  if (diffDays < 7) {
    return `In ${Math.ceil(diffDays)}d`
  }
  if (diffDays < 14) {
    return 'Next week'
  }

  // Default to formatted date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Calculate default due date based on settings
 */
export function getDefaultDueDate(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setHours(17, 0, 0, 0) // Default to 5 PM
  return date.toISOString()
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
export function formatDateForInput(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Calculate days since a date
 */
export function daysSince(dateString: string): number {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  return diffMs / (1000 * 60 * 60 * 24)
}

/**
 * Get the rot level for a card based on how long it's been unchanged
 */
export function getRotLevel(updatedAt: string, settings: CardRottingSettings): RotLevel {
  if (!settings.enabled) return 'none'

  const days = daysSince(updatedAt)

  if (days >= settings.thresholds.heavy) return 'heavy'
  if (days >= settings.thresholds.medium) return 'medium'
  if (days >= settings.thresholds.slight) return 'slight'
  return 'none'
}

/**
 * Get CSS classes for rot level visual effects
 */
export function getRotClasses(level: RotLevel): string {
  switch (level) {
    case 'heavy':
      return 'saturate-[0.3] brightness-75'
    case 'medium':
      return 'saturate-[0.6] brightness-90'
    case 'slight':
      return 'saturate-[0.85] brightness-95'
    default:
      return ''
  }
}

/**
 * Get rot overlay styles (mold effect)
 */
export function getRotOverlay(level: RotLevel): {
  opacity: number
  spots: number
} {
  switch (level) {
    case 'heavy':
      return { opacity: 0.4, spots: 8 }
    case 'medium':
      return { opacity: 0.25, spots: 5 }
    case 'slight':
      return { opacity: 0.1, spots: 2 }
    default:
      return { opacity: 0, spots: 0 }
  }
}

/**
 * Format time for display (e.g., "2:30 PM")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format date for display (e.g., "Monday, January 5")
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}
