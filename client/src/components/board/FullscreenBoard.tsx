import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useBoard } from '../../api/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { LoadingSpinner } from '../ui'
import KanbanCard from './KanbanCard'
import CardModal from './CardModal'
import { formatTime, formatDisplayDate } from '../../utils/dateUtils'
import type { Card } from '../../types'

interface FullscreenBoardProps {
  boardId: number
  onExit: () => void
}

export default function FullscreenBoard({ boardId, onExit }: FullscreenBoardProps) {
  const { settings } = useSettingsStore()
  const { data: board } = useBoard(boardId)
  const queryClient = useQueryClient()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  // Update clock every second
  useEffect(() => {
    if (!settings.fullscreen.showClock) return

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [settings.fullscreen.showClock])

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    }, settings.fullscreen.autoRefreshInterval * 1000)

    return () => clearInterval(interval)
  }, [boardId, queryClient, settings.fullscreen.autoRefreshInterval])

  // Exit on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onExit])

  if (!board) {
    return (
      <div className="fullscreen-mode flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="fullscreen-mode overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-700/50">
        <div>
          <h1 className="text-3xl font-bold text-white">{board.name}</h1>
          {settings.fullscreen.showClock && (
            <p className="text-slate-400 mt-1">{formatDisplayDate(currentTime)}</p>
          )}
        </div>

        <div className="flex items-center gap-6">
          {settings.fullscreen.showClock && (
            <div className="text-right">
              <div className="text-4xl font-light text-white tabular-nums">
                {formatTime(currentTime)}
              </div>
            </div>
          )}

          <button
            onClick={onExit}
            className="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer"
            title="Exit fullscreen (Esc)"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Board content */}
      <div className="flex-1 overflow-x-auto p-8 touch-pan-x">
        <div className="flex gap-6 h-full">
          {board.columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-96 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/30 flex flex-col"
            >
              {/* Column header */}
              <div className="px-5 py-4 border-b border-slate-700/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">{column.name}</h2>
                  <span className="px-2.5 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm font-medium">
                    {column.cards.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar touch-pan-y overscroll-contain">
                {column.cards.map((card) => (
                  <div key={card.id} className="transform scale-105 origin-top">
                    <KanbanCard card={card} onClick={() => setSelectedCard(card)} />
                  </div>
                ))}
                {column.cards.length === 0 && (
                  <div className="text-center py-8 text-slate-500">No cards</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with refresh indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full text-slate-500 text-sm">
        <svg
          className="w-4 h-4 animate-spin-slow"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Auto-refresh every {settings.fullscreen.autoRefreshInterval}s
      </div>

      {/* Card Modal */}
      {selectedCard && board && (
        <CardModal
          card={selectedCard}
          boardId={board.id}
          labels={board.labels || []}
          members={board.members || []}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  )
}
