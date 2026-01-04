// Use a generic WebSocket type that works with both Bun's ServerWebSocket and Elysia's wrapper
type WebSocketLike = {
  send(data: string | ArrayBuffer): void
  readyState: number
}

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
  type: WSEventType
  boardId: number
  payload: unknown
}

interface WSClient {
  ws: WebSocketLike
  boardId?: number
  userId?: number
}

class WebSocketService {
  private clients: Map<WebSocketLike, WSClient> = new Map()
  private boardSubscriptions: Map<number, Set<WebSocketLike>> = new Map()

  addClient(ws: WebSocketLike, userId?: number) {
    this.clients.set(ws, { ws, userId })
  }

  removeClient(ws: WebSocketLike) {
    const client = this.clients.get(ws)
    if (client?.boardId) {
      this.unsubscribeFromBoard(ws, client.boardId)
    }
    this.clients.delete(ws)
  }

  subscribeToBoard(ws: WebSocketLike, boardId: number) {
    const client = this.clients.get(ws)
    if (!client) return

    // Unsubscribe from previous board
    if (client.boardId && client.boardId !== boardId) {
      this.unsubscribeFromBoard(ws, client.boardId)
    }

    // Subscribe to new board
    client.boardId = boardId
    if (!this.boardSubscriptions.has(boardId)) {
      this.boardSubscriptions.set(boardId, new Set())
    }
    this.boardSubscriptions.get(boardId)!.add(ws)
  }

  unsubscribeFromBoard(ws: WebSocketLike, boardId: number) {
    const subscribers = this.boardSubscriptions.get(boardId)
    if (subscribers) {
      subscribers.delete(ws)
      if (subscribers.size === 0) {
        this.boardSubscriptions.delete(boardId)
      }
    }
  }

  broadcast(boardId: number, message: WSMessage, excludeWs?: WebSocketLike) {
    const subscribers = this.boardSubscriptions.get(boardId)
    if (!subscribers) return

    const data = JSON.stringify(message)
    for (const ws of subscribers) {
      if (ws !== excludeWs && ws.readyState === 1) {
        ws.send(data)
      }
    }
  }

  // Convenience methods for broadcasting specific events
  boardUpdated(boardId: number, payload: unknown, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'board:updated', boardId, payload }, excludeWs)
  }

  columnCreated(boardId: number, payload: unknown, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'column:created', boardId, payload }, excludeWs)
  }

  columnUpdated(boardId: number, payload: unknown, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'column:updated', boardId, payload }, excludeWs)
  }

  columnDeleted(boardId: number, columnId: number, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'column:deleted', boardId, payload: { columnId } }, excludeWs)
  }

  cardCreated(boardId: number, payload: unknown, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'card:created', boardId, payload }, excludeWs)
  }

  cardUpdated(boardId: number, payload: unknown, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'card:updated', boardId, payload }, excludeWs)
  }

  cardDeleted(boardId: number, cardId: number, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'card:deleted', boardId, payload: { cardId } }, excludeWs)
  }

  cardMoved(boardId: number, payload: unknown, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'card:moved', boardId, payload }, excludeWs)
  }

  labelCreated(boardId: number, payload: unknown, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'label:created', boardId, payload }, excludeWs)
  }

  labelUpdated(boardId: number, payload: unknown, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'label:updated', boardId, payload }, excludeWs)
  }

  labelDeleted(boardId: number, labelId: number, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'label:deleted', boardId, payload: { labelId } }, excludeWs)
  }

  memberAdded(boardId: number, payload: unknown, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'member:added', boardId, payload }, excludeWs)
  }

  memberRemoved(boardId: number, userId: number, excludeWs?: WebSocketLike) {
    this.broadcast(boardId, { type: 'member:removed', boardId, payload: { userId } }, excludeWs)
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      boardSubscriptions: Object.fromEntries(
        Array.from(this.boardSubscriptions.entries()).map(([boardId, subs]) => [boardId, subs.size])
      ),
    }
  }
}

export const wsService = new WebSocketService()
