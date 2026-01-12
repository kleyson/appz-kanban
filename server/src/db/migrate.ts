import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { db } from './connection'

/**
 * Get the migrations folder path
 * Handles both development and production (bundled) environments
 */
function getMigrationsFolder(): string {
  const currentDir = import.meta.dir

  // Check if we're running from dist/ (bundled) or src/db/ (development)
  if (currentDir.includes('/dist')) {
    // Bundled: dist/index.js -> ../drizzle
    return resolve(currentDir, '../drizzle')
  }

  // Development: src/db/migrate.ts -> ../../drizzle
  return resolve(currentDir, '../../drizzle')
}

/**
 * Run all pending database migrations using Drizzle
 */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = getMigrationsFolder()

  if (!existsSync(migrationsFolder)) {
    throw new Error(`Migrations folder not found: ${migrationsFolder}`)
  }

  migrate(db, { migrationsFolder })
}

// Run migrations directly if this file is executed as a script
if (import.meta.main) {
  runMigrations().catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}
