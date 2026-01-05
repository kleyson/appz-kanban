import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { staticPlugin } from '@elysiajs/static'
import { resolve } from 'path'
import { authController } from './controllers/authController'
import { boardController } from './controllers/boardController'
import { columnController } from './controllers/columnController'
import { cardController } from './controllers/cardController'
import { labelController } from './controllers/labelController'
import { settingsController } from './controllers/settingsController'
import { inviteController } from './controllers/inviteController'
import { wsService } from './services/WebSocketService'
import { runMigrations } from './db/migrate'

// Read version from root package.json (use import.meta.dir for correct path resolution)
const rootPackagePath = resolve(import.meta.dir, '../../package.json')
const rootPackageJson = await Bun.file(rootPackagePath).json()
const APP_VERSION = rootPackageJson.version || '1.0.0'

// Run migrations on startup
await runMigrations()

const isDev = process.env.NODE_ENV !== 'production'
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

// Basic auth credentials for OpenAPI docs
const DOCS_USERNAME = process.env.DOCS_USERNAME || 'admin'
const DOCS_PASSWORD = process.env.DOCS_PASSWORD || 'kanban'

// Basic auth middleware for OpenAPI docs
const basicAuthMiddleware = (authorization: string | null): boolean => {
  if (!authorization || !authorization.startsWith('Basic ')) {
    return false
  }

  const base64Credentials = authorization.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  const [username, password] = credentials.split(':')

  return username === DOCS_USERNAME && password === DOCS_PASSWORD
}

// Configure CORS origins
const corsOrigins = isDev ? ['http://localhost:5173', 'http://localhost:3000'] : true // Allow all origins in production since we're serving from same origin

const app = new Elysia()
  .use(
    cors({
      origin: corsOrigins,
      credentials: true,
    })
  )
  // Basic auth protection for OpenAPI docs
  .onBeforeHandle(({ path, set, request }) => {
    if (path === '/swagger' || path === '/swagger/json') {
      const authorization = request.headers.get('authorization')
      if (!basicAuthMiddleware(authorization)) {
        set.status = 401
        set.headers['WWW-Authenticate'] = 'Basic realm="OpenAPI Documentation"'
        return 'Unauthorized'
      }
    }
  })
  .use(
    swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: 'Appz Kanban API',
          version: APP_VERSION,
          description: 'API documentation for Appz Kanban board application',
        },
        tags: [
          { name: 'Auth', description: 'Authentication endpoints' },
          { name: 'Boards', description: 'Board management' },
          { name: 'Columns', description: 'Column management' },
          { name: 'Cards', description: 'Card management' },
          { name: 'Labels', description: 'Label management' },
          { name: 'Settings', description: 'User settings' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    })
  )
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
      console.log('WebSocket client connected')
      wsService.addClient(ws)
    },
    close(ws) {
      console.log('WebSocket client disconnected')
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
  .get('/api/version', () => ({
    version: APP_VERSION,
    name: 'Appz Kanban',
    buildTime: new Date().toISOString(),
  }))
  .get('/ws/stats', () => wsService.getStats())

// In production, serve static files from client/dist
// Resolve to absolute path (static plugin needs clean paths)
const clientDistPath = resolve(import.meta.dir, '../../client/dist')
console.log(`📂 Static files path: ${clientDistPath}`)

if (!isDev) {
  // Check if client dist exists
  const indexFile = Bun.file(`${clientDistPath}/index.html`)
  if (!(await indexFile.exists())) {
    console.error(`❌ Client dist not found at: ${clientDistPath}`)
    console.error(`   Expected index.html at: ${clientDistPath}/index.html`)
  } else {
    console.log(`✅ Client dist found`)
  }

  app
    .use(
      staticPlugin({
        assets: clientDistPath,
        prefix: '/',
        indexHTML: false, // Disable automatic index.html handling - we handle SPA fallback manually
      })
    )
    // SPA fallback - serve index.html for all non-asset routes
    .get('*', async ({ path }) => {
      // Skip API, WebSocket, and asset routes
      if (
        path.startsWith('/api') ||
        path.startsWith('/ws') ||
        path === '/health' ||
        path.startsWith('/assets')
      ) {
        return
      }
      const file = Bun.file(`${clientDistPath}/index.html`)
      return new Response(file, {
        headers: { 'Content-Type': 'text/html' },
      })
    })
}

app.listen(PORT)

console.log(`🚀 Appz Kanban server is running at ${app.server?.hostname}:${app.server?.port}`)
console.log(`📦 Mode: ${isDev ? 'development' : 'production'}`)
