import { create } from 'zustand'
import type { BoardWithDetails, Card, Column } from '../types'

interface BoardState {
  currentBoard: BoardWithDetails | null
  setCurrentBoard: (board: BoardWithDetails | null) => void
  updateColumn: (column: Column) => void
  addColumn: (column: Column) => void
  removeColumn: (columnId: number) => void
  updateCard: (card: Card) => void
  addCard: (card: Card) => void
  removeCard: (cardId: number) => void
  moveCard: (cardId: number, toColumnId: number, toPosition: number) => void
}

export const useBoardStore = create<BoardState>((set) => ({
  currentBoard: null,

  setCurrentBoard: (board) => set({ currentBoard: board }),

  updateColumn: (column) =>
    set((state) => {
      if (!state.currentBoard) return state
      return {
        currentBoard: {
          ...state.currentBoard,
          columns: state.currentBoard.columns.map((c) =>
            c.id === column.id ? { ...c, ...column } : c
          ),
        },
      }
    }),

  addColumn: (column) =>
    set((state) => {
      if (!state.currentBoard) return state
      return {
        currentBoard: {
          ...state.currentBoard,
          columns: [...state.currentBoard.columns, { ...column, cards: [] }],
        },
      }
    }),

  removeColumn: (columnId) =>
    set((state) => {
      if (!state.currentBoard) return state
      return {
        currentBoard: {
          ...state.currentBoard,
          columns: state.currentBoard.columns.filter((c) => c.id !== columnId),
        },
      }
    }),

  updateCard: (card) =>
    set((state) => {
      if (!state.currentBoard) return state
      return {
        currentBoard: {
          ...state.currentBoard,
          columns: state.currentBoard.columns.map((col) => ({
            ...col,
            cards: col.cards.map((c) => (c.id === card.id ? { ...c, ...card } : c)),
          })),
        },
      }
    }),

  addCard: (card) =>
    set((state) => {
      if (!state.currentBoard) return state
      return {
        currentBoard: {
          ...state.currentBoard,
          columns: state.currentBoard.columns.map((col) =>
            col.id === card.columnId ? { ...col, cards: [...col.cards, card] } : col
          ),
        },
      }
    }),

  removeCard: (cardId) =>
    set((state) => {
      if (!state.currentBoard) return state
      return {
        currentBoard: {
          ...state.currentBoard,
          columns: state.currentBoard.columns.map((col) => ({
            ...col,
            cards: col.cards.filter((c) => c.id !== cardId),
          })),
        },
      }
    }),

  moveCard: (cardId, toColumnId, toPosition) =>
    set((state) => {
      if (!state.currentBoard) return state

      let movedCard: Card | undefined
      const newColumns = state.currentBoard.columns.map((col) => {
        const cardIndex = col.cards.findIndex((c) => c.id === cardId)
        if (cardIndex !== -1) {
          movedCard = col.cards[cardIndex]
          return {
            ...col,
            cards: col.cards.filter((c) => c.id !== cardId),
          }
        }
        return col
      })

      if (!movedCard) return state

      return {
        currentBoard: {
          ...state.currentBoard,
          columns: newColumns.map((col) => {
            if (col.id === toColumnId) {
              const newCards = [...col.cards]
              newCards.splice(toPosition, 0, {
                ...movedCard!,
                columnId: toColumnId,
                position: toPosition,
              })
              return { ...col, cards: newCards }
            }
            return col
          }),
        },
      }
    }),
}))
