import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useBoardStore } from '../stores/boardStore'
import type { Card, Column } from '../types'

export type WSEventType =
  | 'board:updated'
  | 'column:created'
  | 'column:updated'
  | 'column:deleted'
  | 'column:reordered'
  | 'card:created'
  | 'card:updated'
  | 'card:deleted'
  | 'card:moved'
  | 'label:created'
  | 'label:updated'
  | 'label:deleted'
  | 'member:added'
  | 'member:removed'

export interface WSMessage {
  type: WSEventType | 'subscribed' | 'unsubscribed' | 'pong'
  boardId?: number
  payload?: unknown
}

class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private subscribers: Set<(message: WSMessage) => void> = new Set()
  private currentBoardId: number | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private baseReconnectDelay = 1000

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.hostname}:3000/ws`

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0

        // Resubscribe to current board
        if (this.currentBoardId) {
          this.subscribeToBoard(this.currentBoardId)
        }

        // Start ping interval
        this.pingInterval = setInterval(() => {
          this.send({ type: 'ping' })
        }, 30000)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.cleanup()
        this.scheduleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage
          this.notifySubscribers(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      this.scheduleReconnect()
    }
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    this.reconnectTimeout = setTimeout(() => {
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      )
      this.connect()
    }, delay)
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.cleanup()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  subscribeToBoard(boardId: number) {
    this.currentBoardId = boardId
    this.send({ type: 'subscribe', boardId })
  }

  unsubscribeFromBoard() {
    this.currentBoardId = null
    this.send({ type: 'unsubscribe' })
  }

  subscribe(callback: (message: WSMessage) => void) {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  private notifySubscribers(message: WSMessage) {
    this.subscribers.forEach((callback) => callback(message))
  }
}

export const wsClient = new WebSocketClient()

// React hook for WebSocket integration
export function useWebSocket(boardId: number | undefined) {
  const queryClient = useQueryClient()
  const { addColumn, updateColumn, removeColumn, addCard, updateCard, removeCard, moveCard } =
    useBoardStore()

  const handleMessage = useCallback(
    (message: WSMessage) => {
      if (!boardId || message.boardId !== boardId) return

      switch (message.type) {
        case 'column:created': {
          const column = message.payload as Column
          addColumn(column)
          break
        }
        case 'column:updated': {
          const column = message.payload as Column
          updateColumn(column)
          break
        }
        case 'column:deleted': {
          const { columnId } = message.payload as { columnId: number }
          removeColumn(columnId)
          break
        }
        case 'column:reordered': {
          // Refetch the board to get the new order
          queryClient.invalidateQueries({ queryKey: ['board', boardId] })
          break
        }
        case 'card:created': {
          const card = message.payload as Card
          addCard(card)
          break
        }
        case 'card:updated': {
          const card = message.payload as Card
          updateCard(card)
          break
        }
        case 'card:deleted': {
          const { cardId } = message.payload as { cardId: number }
          removeCard(cardId)
          break
        }
        case 'card:moved': {
          const { cardId, columnId, position } = message.payload as {
            cardId: number
            columnId: number
            position: number
          }
          moveCard(cardId, columnId, position)
          break
        }
        case 'label:created':
        case 'label:updated':
        case 'label:deleted':
        case 'member:added':
        case 'member:removed':
        case 'board:updated': {
          // Refetch the board for these changes
          queryClient.invalidateQueries({ queryKey: ['board', boardId] })
          break
        }
      }
    },
    [
      boardId,
      queryClient,
      addColumn,
      updateColumn,
      removeColumn,
      addCard,
      updateCard,
      removeCard,
      moveCard,
    ]
  )

  useEffect(() => {
    // Connect to WebSocket
    wsClient.connect()

    // Subscribe to board if we have one
    if (boardId) {
      wsClient.subscribeToBoard(boardId)
    }

    // Subscribe to messages
    const unsubscribe = wsClient.subscribe(handleMessage)

    return () => {
      unsubscribe()
      if (boardId) {
        wsClient.unsubscribeFromBoard()
      }
    }
  }, [boardId, handleMessage])

  return wsClient
}
