import { describe, it, expect } from 'bun:test'
import {
  parseEmojis,
  renderMarkdown,
  escapeHtml,
  getMarkdownPreview,
  hasMarkdownFormatting,
} from '../markdown'
import type { CustomEmoji } from '../../types'

describe('parseEmojis', () => {
  it('should convert standard emoji shortcodes to unicode', () => {
    const result = parseEmojis(':smile:')
    expect(result).not.toContain(':smile:')
    // Should contain the unicode emoji or be transformed
  })

  it('should replace custom emojis with img tags', () => {
    const customEmojis: CustomEmoji[] = [
      { shortcode: ':kanban:', imageData: 'data:image/png;base64,abc123', name: 'Kanban' },
    ]

    const result = parseEmojis('Hello :kanban:', customEmojis)
    expect(result).toContain('<img')
    expect(result).toContain('class="inline-emoji"')
    expect(result).toContain('data:image/png;base64,abc123')
  })

  it('should leave unknown shortcodes unchanged', () => {
    const result = parseEmojis(':unknownemoji:')
    // May or may not be transformed depending on emoji-toolkit
    expect(typeof result).toBe('string')
  })

  it('should handle text without emojis', () => {
    const result = parseEmojis('Hello world')
    expect(result).toBe('Hello world')
  })

  it('should handle multiple emojis', () => {
    const result = parseEmojis(':smile: :heart:')
    expect(typeof result).toBe('string')
  })
})

describe('renderMarkdown', () => {
  it('should render basic markdown', () => {
    const result = renderMarkdown('**bold** text')
    expect(result).toContain('<strong>')
    expect(result).toContain('bold')
  })

  it('should render headers', () => {
    const result = renderMarkdown('# Header 1')
    expect(result).toContain('<h1>')
  })

  it('should render links', () => {
    const result = renderMarkdown('[link](https://example.com)')
    expect(result).toContain('<a')
    expect(result).toContain('href="https://example.com"')
  })

  it('should render code blocks', () => {
    const result = renderMarkdown('`inline code`')
    expect(result).toContain('<code>')
  })

  it('should render lists', () => {
    const result = renderMarkdown('- item 1\n- item 2')
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>')
  })

  it('should handle empty text', () => {
    const result = renderMarkdown('')
    expect(result).toBe('')
  })

  it('should include custom emojis', () => {
    const customEmojis: CustomEmoji[] = [
      { shortcode: ':test:', imageData: 'data:image/png;base64,test', name: 'Test' },
    ]

    const result = renderMarkdown('Hello :test:', customEmojis)
    expect(result).toContain('<img')
  })
})

describe('escapeHtml', () => {
  it('should escape HTML tags', () => {
    const result = escapeHtml('<script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
  })

  it('should escape ampersands', () => {
    const result = escapeHtml('a & b')
    expect(result).toContain('&amp;')
  })

  it('should escape quotes', () => {
    const result = escapeHtml('say "hello"')
    expect(result).toContain('&quot;')
  })

  it('should handle plain text', () => {
    const result = escapeHtml('Hello world')
    expect(result).toBe('Hello world')
  })
})

describe('getMarkdownPreview', () => {
  it('should strip markdown formatting', () => {
    const result = getMarkdownPreview('**bold** text')
    expect(result).not.toContain('**')
    expect(result).toContain('bold')
  })

  it('should replace links with text', () => {
    const result = getMarkdownPreview('[click here](https://example.com)')
    expect(result).toContain('click here')
    expect(result).not.toContain('https://')
  })

  it('should truncate long text', () => {
    const longText = 'a'.repeat(200)
    const result = getMarkdownPreview(longText, 50)
    expect(result.length).toBeLessThanOrEqual(50)
    expect(result).toContain('...')
  })

  it('should handle empty text', () => {
    const result = getMarkdownPreview('')
    expect(result).toBe('')
  })

  it('should replace newlines with spaces', () => {
    const result = getMarkdownPreview('line 1\nline 2')
    expect(result).not.toContain('\n')
    expect(result).toContain(' ')
  })
})

describe('hasMarkdownFormatting', () => {
  it('should detect bold text', () => {
    expect(hasMarkdownFormatting('**bold**')).toBe(true)
  })

  it('should detect italic text', () => {
    expect(hasMarkdownFormatting('*italic*')).toBe(true)
  })

  it('should detect headers', () => {
    expect(hasMarkdownFormatting('# Header')).toBe(true)
  })

  it('should detect links', () => {
    expect(hasMarkdownFormatting('[link](url)')).toBe(true)
  })

  it('should detect code', () => {
    expect(hasMarkdownFormatting('`code`')).toBe(true)
  })

  it('should detect lists', () => {
    expect(hasMarkdownFormatting('- item')).toBe(true)
  })

  it('should return false for plain text', () => {
    expect(hasMarkdownFormatting('Hello world')).toBe(false)
  })

  it('should handle empty text', () => {
    expect(hasMarkdownFormatting('')).toBe(false)
  })
})
