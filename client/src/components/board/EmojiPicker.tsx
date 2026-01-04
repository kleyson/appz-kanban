import { useState, useEffect, useRef, useMemo } from 'react'
import emojiToolkit from 'emoji-toolkit'
import { useSettingsStore } from '../../stores/settingsStore'
import type { CustomEmoji } from '../../types'

interface EmojiPickerProps {
  searchQuery: string
  position: { top: number; left: number }
  onSelect: (emoji: string) => void
  onClose: () => void
}

interface EmojiOption {
  shortcode: string
  emoji: string
  isCustom: boolean
  imageData?: string
}

// Common emojis for quick access
const COMMON_EMOJIS = [
  ':smile:',
  ':grinning:',
  ':joy:',
  ':heart:',
  ':thumbsup:',
  ':thumbsdown:',
  ':clap:',
  ':fire:',
  ':rocket:',
  ':star:',
  ':sparkles:',
  ':check:',
  ':x:',
  ':warning:',
  ':bulb:',
  ':memo:',
  ':bug:',
  ':wrench:',
  ':hammer:',
  ':zap:',
  ':hourglass:',
  ':calendar:',
  ':pushpin:',
  ':bookmark:',
  ':link:',
  ':lock:',
  ':unlock:',
  ':bell:',
  ':eye:',
  ':speech_balloon:',
  ':thought_balloon:',
  ':100:',
  ':wave:',
  ':raised_hands:',
  ':pray:',
  ':muscle:',
  ':point_right:',
  ':point_left:',
  ':point_up:',
  ':point_down:',
]

export default function EmojiPicker({
  searchQuery,
  position,
  onSelect,
  onClose,
}: EmojiPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const { settings } = useSettingsStore()

  // Build emoji options from search query
  const options = useMemo(() => {
    const results: EmojiOption[] = []
    const query = searchQuery.toLowerCase()

    // Add custom emojis first
    settings.customEmojis.forEach((emoji: CustomEmoji) => {
      if (emoji.shortcode.toLowerCase().includes(query)) {
        results.push({
          shortcode: emoji.shortcode,
          emoji: emoji.name,
          isCustom: true,
          imageData: emoji.imageData,
        })
      }
    })

    // Filter common emojis by search query
    COMMON_EMOJIS.forEach((shortcode) => {
      if (shortcode.toLowerCase().includes(query)) {
        const unicode = emojiToolkit.shortnameToUnicode(shortcode)
        if (unicode !== shortcode) {
          results.push({
            shortcode,
            emoji: unicode,
            isCustom: false,
          })
        }
      }
    })

    return results.slice(0, 8)
  }, [searchQuery, settings.customEmojis])

  // Reset selection when options change
  useEffect(() => {
    setSelectedIndex(0)
  }, [options])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (options.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % options.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + options.length) % options.length)
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          if (options[selectedIndex]) {
            onSelect(options[selectedIndex].shortcode)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [options, selectedIndex, onSelect, onClose])

  if (options.length === 0) {
    return null
  }

  return (
    <div
      className="absolute z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 min-w-[200px] max-h-[200px] overflow-y-auto"
      style={{ top: position.top, left: position.left }}
      ref={listRef}
    >
      {options.map((option, index) => (
        <button
          key={option.shortcode}
          onClick={() => onSelect(option.shortcode)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${
            index === selectedIndex
              ? 'bg-primary-500/20 text-white'
              : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          {option.isCustom ? (
            <img src={option.imageData} alt={option.emoji} className="w-5 h-5" />
          ) : (
            <span className="text-lg">{option.emoji}</span>
          )}
          <span className="text-sm font-mono text-slate-400">{option.shortcode}</span>
        </button>
      ))}
    </div>
  )
}
