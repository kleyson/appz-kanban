/**
 * API E2E Test Setup
 *
 * This file provides utilities for testing API endpoints using Elysia's .handle() method.
 * Tests use a separate test database that is reset between test runs.
 *
 * IMPORTANT: DATABASE_PATH must be set before running tests.
 * Use: DATABASE_PATH=data/test_api.db bun test src/__tests__/api/
 */

import { beforeAll, beforeEach } from 'bun:test'
import { buildApp } from '../../app'
import { rawDb } from '../../db/connection'
import { runMigrations } from '../../db/migrate'

// Track if migrations have been run
let migrationsRun = false

// Build the test app instance
export const app = buildApp({ enableCors: false })

// Type for the app
export type TestApp = typeof app

/**
 * Helper to make a request to the test app
 */
export async function request(
  path: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    token?: string
  } = {}
) {
  const { method = 'GET', body, headers = {}, token } = options

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  }

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body)
  }

  const response = await app.handle(new Request(`http://localhost${path}`, requestInit))

  return response
}

/**
 * Helper to parse JSON response
 */
export async function parseResponse<T = unknown>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Failed to parse response as JSON: ${text}`)
  }
}

/**
 * Helper to register a test user and get a token
 */
export async function registerTestUser(
  username = 'testuser',
  password = 'password123',
  displayName = 'Test User',
  inviteCode?: string
): Promise<{ token: string; user: { id: number; username: string; displayName: string } }> {
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: { username, password, displayName, inviteCode },
  })

  if (response.status !== 200) {
    const error = await parseResponse<{ error: { code: string; message: string } }>(response)
    throw new Error(`Failed to register user: ${error.error?.message || 'Unknown error'}`)
  }

  return parseResponse(response)
}

/**
 * Helper to login a test user and get a token
 */
export async function loginTestUser(
  username: string,
  password: string
): Promise<{ token: string; user: { id: number; username: string; displayName: string } }> {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  })

  if (response.status !== 200) {
    const error = await parseResponse<{ error: { code: string; message: string } }>(response)
    throw new Error(`Failed to login: ${error.error?.message || 'Unknown error'}`)
  }

  return parseResponse(response)
}

/**
 * Clear all data from the test database while preserving the schema
 */
export function clearTestData() {
  try {
    // Disable foreign key checks temporarily
    rawDb.run('PRAGMA foreign_keys = OFF')

    // Clear all tables in reverse dependency order
    // Use try-catch for each in case table doesn't exist yet
    const tables = [
      'card_labels',
      'cards',
      'labels',
      'columns',
      'board_members',
      'user_settings',
      'boards',
      'invites',
      'users',
    ]

    for (const table of tables) {
      try {
        rawDb.run(`DELETE FROM ${table}`)
      } catch {
        // Table might not exist yet, ignore
      }
    }

    // Re-enable foreign keys
    rawDb.run('PRAGMA foreign_keys = ON')
  } catch {
    // Database might not be ready, ignore
  }
}

/**
 * Setup hook to register - runs migrations once and clears data before each test
 * Call this in each test file's describe block
 */
export function setupApiTests() {
  beforeAll(async () => {
    if (!migrationsRun) {
      await runMigrations(true) // silent mode
      migrationsRun = true
    }
    clearTestData()
  })

  beforeEach(() => {
    clearTestData()
  })
}
