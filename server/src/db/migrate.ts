import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'
import { db, rawDb } from './connection'

interface MigrationJournalEntry {
  idx: number
  version: string
  when: number
  tag: string
  breakpoints: boolean
}

interface MigrationJournal {
  version: string
  dialect: string
  entries: MigrationJournalEntry[]
}

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
 * Get count of already applied migrations from the database
 */
function getAppliedMigrationsCount(): number {
  try {
    // Check if migrations table exists
    const tableExists = rawDb
      .query("SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'")
      .get()

    if (tableExists) {
      const result = rawDb.query('SELECT COUNT(*) as count FROM __drizzle_migrations').get() as {
        count: number
      }
      return result.count
    }
  } catch {
    // Table doesn't exist yet, no migrations applied
  }

  return 0
}

/**
 * Run all pending database migrations using Drizzle
 * @param silent - If true, suppresses console output
 */
export async function runMigrations(silent = false): Promise<void> {
  const log = silent ? () => {} : console.log

  const migrationsFolder = getMigrationsFolder()

  // Verify migrations folder exists
  if (!existsSync(migrationsFolder)) {
    const error = new Error(
      `Migrations folder not found at: ${migrationsFolder}. ` +
        `Ensure the drizzle folder is properly copied in the build.`
    )
    console.error('❌', error.message)
    throw error
  }

  // Read migration journal
  const journalPath = resolve(migrationsFolder, 'meta/_journal.json')
  if (!existsSync(journalPath)) {
    const error = new Error(`Migration journal not found at: ${journalPath}`)
    console.error('❌', error.message)
    throw error
  }

  const journal: MigrationJournal = JSON.parse(readFileSync(journalPath, 'utf-8'))
  const appliedCount = getAppliedMigrationsCount()
  const totalMigrations = journal.entries.length
  const pendingCount = totalMigrations - appliedCount

  if (pendingCount <= 0) {
    log('📦 Database schema is up to date')
    return
  }

  // Get the pending migrations (those after the applied count)
  const pendingMigrations = journal.entries.slice(appliedCount)

  log(`📦 Running ${pendingCount} pending migration(s)...`)

  for (const migration of pendingMigrations) {
    log(`   ↳ Applying: ${migration.tag}`)
  }

  try {
    migrate(db, { migrationsFolder })
    log('📦 Migrations complete!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
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
