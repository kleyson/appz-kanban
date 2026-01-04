import { marked } from 'marked'
import emojiToolkit from 'emoji-toolkit'
import type { CustomEmoji } from '../types'

// Configure marked for safe HTML rendering
marked.setOptions({
  gfm: true,
  breaks: true,
})

// Emoji shortcode regex pattern
const emojiShortcodeRegex = /:[a-zA-Z0-9_+-]+:/g

/**
 * Parse emoji shortcodes to unicode or custom emoji images
 */
export function parseEmojis(text: string, customEmojis: CustomEmoji[] = []): string {
  // First, replace custom emojis
  let result = text.replace(emojiShortcodeRegex, (match) => {
    // Check if it's a custom emoji
    const customEmoji = customEmojis.find((e) => e.shortcode === match)
    if (customEmoji) {
      return `<img class="inline-emoji" src="${customEmoji.imageData}" alt="${customEmoji.name}" title="${customEmoji.name}" />`
    }
    return match
  })

  // Then use emoji-toolkit for standard shortcodes
  // emoji-toolkit converts shortcodes like :smile: to unicode
  result = emojiToolkit.shortnameToUnicode(result)

  return result
}

/**
 * Render markdown to HTML with emoji support
 */
export function renderMarkdown(text: string, customEmojis: CustomEmoji[] = []): string {
  if (!text) return ''

  // Parse emojis in the raw text first
  const withEmojis = parseEmojis(text, customEmojis)

  // Then render markdown
  const html = marked.parse(withEmojis) as string

  return html
}

/**
 * Escape HTML to prevent XSS when not rendering markdown
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Get a plain text preview from markdown (strips formatting)
 */
export function getMarkdownPreview(text: string, maxLength: number = 100): string {
  if (!text) return ''

  // Remove markdown syntax for preview
  let preview = text
    .replace(/[#*_~`]/g, '') // Remove common markdown chars
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove images
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim()

  // Truncate if needed
  if (preview.length > maxLength) {
    preview = preview.substring(0, maxLength - 3) + '...'
  }

  return preview
}

/**
 * Check if text contains any markdown formatting
 */
export function hasMarkdownFormatting(text: string): boolean {
  if (!text) return false

  const markdownPatterns = [
    /^#{1,6}\s/, // Headers
    /\*\*[^*]+\*\*/, // Bold
    /\*[^*]+\*/, // Italic
    /__[^_]+__/, // Bold
    /_[^_]+_/, // Italic
    /~~[^~]+~~/, // Strikethrough
    /`[^`]+`/, // Inline code
    /```[\s\S]*```/, // Code block
    /^\s*[-*+]\s/, // Lists
    /^\s*\d+\.\s/, // Numbered lists
    /\[([^\]]+)\]\([^)]+\)/, // Links
    /!\[[^\]]*\]\([^)]+\)/, // Images
    /^\s*>\s/, // Blockquotes
    /^\s*[-*_]{3,}\s*$/, // Horizontal rule
  ]

  return markdownPatterns.some((pattern) => pattern.test(text))
}
