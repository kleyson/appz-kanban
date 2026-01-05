import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import { join, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import * as schema from './schema'

// Use environment variable or default to relative path
const dbPath = process.env.DATABASE_PATH || join(import.meta.dir, '../../data/kanban.db')

// Check if this is a new database
const isNewDatabase = !existsSync(dbPath)

// Ensure data directory exists
const dataDir = dirname(dbPath)
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// Log database status
if (isNewDatabase) {
  console.log(`🗄️  Creating new database: ${dbPath}`)
} else {
  console.log(`🗄️  Using existing database: ${dbPath}`)
}

// Create SQLite database
const sqlite = new Database(dbPath, { create: true })

// Enable foreign keys
sqlite.run('PRAGMA foreign_keys = ON')

// Create Drizzle ORM instance with schema for relations
export const db = drizzle(sqlite, { schema })

// Export raw sqlite for migrations
export const rawDb = sqlite

export function getDb() {
  return db
}
