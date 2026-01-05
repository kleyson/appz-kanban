import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { resolve } from 'path'
import { db } from './connection'

// Migrations folder - handle both dev (src/db/) and bundled (dist/) paths
const isBundle = import.meta.dir.endsWith('/dist')
const migrationsFolder = isBundle
  ? resolve(import.meta.dir, '../drizzle')
  : resolve(import.meta.dir, '../../drizzle')

/**
 * Run all pending database migrations using Drizzle
 * @param silent - If true, suppresses console output
 */
export async function runMigrations(silent = false): Promise<void> {
  const log = silent ? () => {} : console.log

  try {
    log('📦 Running database migrations...')
    migrate(db, { migrationsFolder })
    log('📦 Database migrations complete!')
  } catch (error) {
    // If migrations folder doesn't exist yet, that's okay for fresh installs
    if (error instanceof Error && error.message.includes('ENOENT')) {
      log('📦 No migrations to run (fresh install)')
      return
    }
    throw error
  }
}

// Run migrations directly if this file is executed as a script
if (import.meta.main) {
  runMigrations().catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}
