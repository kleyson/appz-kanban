import { useState, useRef } from 'react'
import type { CustomEmoji } from '../../types'
import SettingsSection from './SettingsSection'
import { validateEmojiFile, formatShortcode } from './settingsHelpers'

interface CustomEmojisSectionProps {
  customEmojis: CustomEmoji[]
  onAddEmoji: (emoji: CustomEmoji) => void
  onDeleteEmoji: (shortcode: string) => void
}

export default function CustomEmojisSection({
  customEmojis,
  onAddEmoji,
  onDeleteEmoji,
}: CustomEmojisSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newEmojiName, setNewEmojiName] = useState('')
  const [newEmojiShortcode, setNewEmojiShortcode] = useState('')
  const [newEmojiPreview, setNewEmojiPreview] = useState<string | null>(null)

  const handleEmojiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateEmojiFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setNewEmojiPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAddEmoji = () => {
    if (!newEmojiName.trim() || !newEmojiShortcode.trim() || !newEmojiPreview) {
      alert('Please fill in all fields and select an image')
      return
    }

    const shortcode = formatShortcode(newEmojiShortcode)

    // Check for duplicate shortcode
    if (customEmojis.some((e) => e.shortcode === shortcode)) {
      alert('An emoji with this shortcode already exists')
      return
    }

    onAddEmoji({
      shortcode,
      name: newEmojiName.trim(),
      imageData: newEmojiPreview,
    })

    // Reset form
    setNewEmojiName('')
    setNewEmojiShortcode('')
    setNewEmojiPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteEmoji = (shortcode: string) => {
    if (confirm(`Delete emoji ${shortcode}?`)) {
      onDeleteEmoji(shortcode)
    }
  }

  return (
    <SettingsSection
      title="Custom Emojis"
      description="Add custom emojis to use in card descriptions with shortcodes like :shortcode:"
    >
      {/* Existing emojis */}
      {customEmojis.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Your Custom Emojis</h3>
          <div className="flex flex-wrap gap-3">
            {customEmojis.map((emoji) => (
              <div
                key={emoji.shortcode}
                className="group relative flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg"
              >
                <img
                  src={emoji.imageData}
                  alt={emoji.name}
                  className="w-6 h-6 object-contain"
                />
                <div className="text-sm">
                  <span className="text-white">{emoji.name}</span>
                  <span className="text-slate-500 ml-2">{emoji.shortcode}</span>
                </div>
                <button
                  onClick={() => handleDeleteEmoji(emoji.shortcode)}
                  className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center text-xs transition-opacity cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new emoji form */}
      <div className="space-y-4 p-4 bg-slate-900/30 border border-slate-700/30 rounded-lg">
        <h3 className="text-sm font-medium text-white">Add New Emoji</h3>

        <div className="flex gap-4">
          {/* Preview */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-slate-800 border border-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
              {newEmojiPreview ? (
                <img
                  src={newEmojiPreview}
                  alt="Preview"
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <span className="text-slate-500 text-2xl">?</span>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="flex-1 space-y-3">
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleEmojiFileSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors cursor-pointer"
              >
                Choose Image
              </button>
              <span className="text-slate-500 text-xs ml-3">Max 100KB, PNG/JPG/GIF</span>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={newEmojiName}
                onChange={(e) => setNewEmojiName(e.target.value)}
                placeholder="Name (e.g., Kanban Logo)"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              <input
                type="text"
                value={newEmojiShortcode}
                onChange={(e) => setNewEmojiShortcode(e.target.value)}
                placeholder="Shortcode (e.g., kanban)"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleAddEmoji}
          disabled={!newEmojiPreview || !newEmojiName || !newEmojiShortcode}
          className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Add Emoji
        </button>
      </div>
    </SettingsSection>
  )
}
