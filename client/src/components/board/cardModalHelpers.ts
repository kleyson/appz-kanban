import type { Priority, Subtask } from '../../types'

/**
 * Priority options for the card modal
 */
export const priorityOptions: { value: Priority | ''; label: string; color: string }[] = [
  { value: '', label: 'No priority', color: 'bg-slate-600' },
  { value: 'low', label: 'Low', color: 'bg-emerald-500' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
  { value: 'high', label: 'High', color: 'bg-red-500' },
]

/**
 * Priority configuration for display styling
 */
export const priorityConfig = {
  low: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Low' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Medium' },
  high: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'High' },
}

/**
 * Color options for card color picker
 */
export const colorOptions = [
  '#0ea5e9', // primary
  '#22c55e', // green
  '#eab308', // yellow
  '#f97316', // orange
  '#ef4444', // red
  '#a855f7', // purple
  '#ec4899', // pink
  '#6b7280', // gray
]

/**
 * Default colors for new labels
 */
export const labelColors = [
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

/**
 * Interface for pending labels that haven't been created yet
 */
export interface PendingLabel {
  name: string
  color: string
}

/**
 * Modal mode type
 */
export type ModalMode = 'view' | 'edit'

/**
 * Emoji search state
 */
export interface EmojiSearchState {
  query: string
  position: { top: number; left: number }
}

/**
 * Parse emoji shortcode from text input
 */
export function parseEmojiShortcode(
  value: string,
  cursorPos: number
): EmojiSearchState | null {
  const textBeforeCursor = value.substring(0, cursorPos)
  const colonMatch = textBeforeCursor.match(/:([a-zA-Z0-9_+-]*)$/)

  if (colonMatch && colonMatch[1].length >= 1) {
    return {
      query: colonMatch[1],
      position: { top: 28, left: 0 },
    }
  }
  return null
}

/**
 * Insert emoji shortcode into text
 */
export function insertEmojiShortcode(
  text: string,
  cursorPos: number,
  shortcode: string
): { newText: string; newCursorPos: number } {
  const textBeforeCursor = text.substring(0, cursorPos)
  const textAfterCursor = text.substring(cursorPos)
  const colonIndex = textBeforeCursor.lastIndexOf(':')
  const newText = textBeforeCursor.substring(0, colonIndex) + shortcode + ' ' + textAfterCursor
  const newCursorPos = colonIndex + shortcode.length + 1
  return { newText, newCursorPos }
}

/**
 * Get random label color
 */
export function getRandomLabelColor(): string {
  return labelColors[Math.floor(Math.random() * labelColors.length)]
}

/**
 * Format shortcode to ensure it has colons
 */
export function formatShortcode(shortcode: string): string {
  let formatted = shortcode.trim().toLowerCase()
  if (!formatted.startsWith(':')) formatted = ':' + formatted
  if (!formatted.endsWith(':')) formatted = formatted + ':'
  return formatted
}

/**
 * Create a new subtask
 */
export function createSubtask(title: string): Subtask {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
  }
}

/**
 * Toggle subtask completion
 */
export function toggleSubtaskCompletion(subtasks: Subtask[], id: string): Subtask[] {
  return subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
}

/**
 * Calculate subtask progress
 */
export function calculateProgress(subtasks: Subtask[]): {
  completed: number
  total: number
  percent: number
} {
  const total = subtasks.length
  const completed = subtasks.filter((s) => s.completed).length
  const percent = total > 0 ? (completed / total) * 100 : 0
  return { completed, total, percent }
}
