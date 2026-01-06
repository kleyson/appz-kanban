import { useState, useRef } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import EmojiPicker from './EmojiPicker'
import { parseEmojiShortcode, insertEmojiShortcode, EmojiSearchState } from './cardModalHelpers'

interface CardDescriptionEditorProps {
  description: string
  mode: 'view' | 'edit'
  onChange: (value: string) => void
  onEnterEditMode: () => void
}

export default function CardDescriptionEditor({
  description,
  mode,
  onChange,
  onEnterEditMode,
}: CardDescriptionEditorProps) {
  const [descriptionTab, setDescriptionTab] = useState<'write' | 'preview'>('write')
  const [emojiSearch, setEmojiSearch] = useState<EmojiSearchState | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    onChange(value)

    const emojiState = parseEmojiShortcode(value, cursorPos)
    setEmojiSearch(emojiState)
  }

  const handleEmojiSelect = (shortcode: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart
    const { newText, newCursorPos } = insertEmojiShortcode(description, cursorPos, shortcode)

    onChange(newText)
    setEmojiSearch(null)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  return (
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
        <div
          className="p-4 bg-slate-900/30 border border-slate-700/30 rounded-xl min-h-[80px] hover:bg-slate-800/30 cursor-pointer transition-colors"
          onDoubleClick={onEnterEditMode}
          title="Double-click to edit"
        >
          <MarkdownRenderer content={description} />
        </div>
      )}
    </div>
  )
}
