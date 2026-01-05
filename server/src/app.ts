import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { authController } from './controllers/authController'
import { boardController } from './controllers/boardController'
import { columnController } from './controllers/columnController'
import { cardController } from './controllers/cardController'
import { labelController } from './controllers/labelController'
import { settingsController } from './controllers/settingsController'
import { inviteController } from './controllers/inviteController'
import { wsService } from './services/WebSocketService'

export interface AppOptions {
  enableCors?: boolean
  corsOrigins?: string[] | boolean
}

/**
 * Build the Elysia app instance without starting the server.
 * This allows the app to be tested using Elysia's .handle() method.
 */
export function buildApp(options: AppOptions = {}) {
  const { enableCors = true, corsOrigins = true } = options

  const app = new Elysia()

  if (enableCors) {
    app.use(
      cors({
        origin: corsOrigins,
        credentials: true,
      })
    )
  }

  app
    .onError(({ error, set }) => {
      console.error('Error:', error)

      const errorMessage = error instanceof Error ? error.message : String(error)

      if (errorMessage.includes('Unauthorized')) {
        set.status = 401
        return { error: 'Unauthorized' }
      }

      set.status = 400
      return { error: errorMessage }
    })
    // WebSocket endpoint
    .ws('/ws', {
      open(ws) {
        wsService.addClient(ws)
      },
      close(ws) {
        wsService.removeClient(ws)
      },
      message(ws, message) {
        try {
          const data = typeof message === 'string' ? JSON.parse(message) : message

          if (data.type === 'subscribe' && typeof data.boardId === 'number') {
            wsService.subscribeToBoard(ws, data.boardId)
            ws.send(JSON.stringify({ type: 'subscribed', boardId: data.boardId }))
          } else if (data.type === 'unsubscribe') {
            const client = wsService['clients'].get(ws)
            if (client?.boardId) {
              wsService.unsubscribeFromBoard(ws, client.boardId)
              ws.send(JSON.stringify({ type: 'unsubscribed' }))
            }
          } else if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }))
          }
        } catch (error) {
          console.error('WebSocket message error:', error)
        }
      },
    })
    .group('/api', (app) =>
      app
        .use(authController)
        .use(boardController)
        .use(columnController)
        .use(cardController)
        .use(labelController)
        .use(settingsController)
        .use(inviteController)
    )
    .get('/health', () => ({ status: 'ok' }))
    .get('/ws/stats', () => wsService.getStats())

  return app
}
