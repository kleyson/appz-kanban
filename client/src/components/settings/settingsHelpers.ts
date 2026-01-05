import type { WebhookEvent } from '../../types'

/**
 * Webhook events configuration
 */
export const WEBHOOK_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: 'card.created', label: 'Card Created' },
  { value: 'card.updated', label: 'Card Updated' },
  { value: 'card.moved', label: 'Card Moved' },
  { value: 'card.deleted', label: 'Card Deleted' },
  { value: 'column.created', label: 'Column Created' },
  { value: 'column.deleted', label: 'Column Deleted' },
  { value: 'board.created', label: 'Board Created' },
  { value: 'label.created', label: 'Label Created' },
]

/**
 * Validate emoji file
 */
export function validateEmojiFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 100KB)
  if (file.size > 100 * 1024) {
    return { valid: false, error: 'Emoji image must be less than 100KB' }
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file' }
  }

  return { valid: true }
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
 * Toggle webhook event in array
 */
export function toggleWebhookEvent(
  events: WebhookEvent[],
  event: WebhookEvent
): WebhookEvent[] {
  return events.includes(event)
    ? events.filter((e) => e !== event)
    : [...events, event]
}
