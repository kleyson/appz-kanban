import { useState } from 'react'
import { useArchivedCards, useUnarchiveCard, useDeleteCard } from '../../api/hooks'
import { formatRelativeTime } from '../../utils/dateUtils'
import { LoadingSpinner, Button } from '../ui'
import type { ColumnWithCards } from '../../types'

interface ArchivedCardsPanelProps {
  boardId: number
  columns: ColumnWithCards[]
  onClose: () => void
}

export default function ArchivedCardsPanel({ boardId, columns, onClose }: ArchivedCardsPanelProps) {
  const { data: archivedCards, isLoading } = useArchivedCards(boardId)
  const unarchiveCard = useUnarchiveCard()
  const deleteCard = useDeleteCard()
  const [restoreColumnId, setRestoreColumnId] = useState<{ [cardId: number]: number }>({})

  const handleRestore = async (cardId: number) => {
    const columnId = restoreColumnId[cardId] || columns[0]?.id
    if (!columnId) return

    await unarchiveCard.mutateAsync({ cardId, columnId })
  }

  const handleDelete = async (cardId: number) => {
    if (confirm('Are you sure you want to permanently delete this card? This cannot be undone.')) {
      await deleteCard.mutateAsync(cardId)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-slate-700 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Archived Cards</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : archivedCards && archivedCards.length > 0 ? (
            archivedCards.map((card) => (
              <div
                key={card.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3"
              >
                {/* Card title and info */}
                <div>
                  <h3 className="text-white font-medium">{card.title}</h3>
                  {card.archivedAt && (
                    <p className="text-slate-500 text-xs mt-1">
                      Archived {formatRelativeTime(card.archivedAt)}
                    </p>
                  )}
                </div>

                {/* Restore column selector */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Restore to column:</label>
                  <select
                    value={restoreColumnId[card.id] || columns[0]?.id || ''}
                    onChange={(e) =>
                      setRestoreColumnId((prev) => ({
                        ...prev,
                        [card.id]: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRestore(card.id)}
                    isLoading={unarchiveCard.isPending}
                    variant="primary"
                    size="sm"
                    className="flex-1"
                  >
                    Restore
                  </Button>
                  <Button
                    onClick={() => handleDelete(card.id)}
                    isLoading={deleteCard.isPending}
                    variant="danger"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 mx-auto text-slate-600 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <p className="text-slate-500">No archived cards</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
