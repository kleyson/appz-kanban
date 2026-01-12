import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { resolve } from 'path'
import { existsSync, readdirSync } from 'fs'
import { db, rawDb } from './connection'

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
  console.log(`📂 Running migrations from: ${migrationsFolder}`)

  // Debug: check folder exists and list contents
  if (!existsSync(migrationsFolder)) {
    console.error(`❌ Migrations folder does not exist: ${migrationsFolder}`)
    throw new Error(`Migrations folder not found: ${migrationsFolder}`)
  }

  const files = readdirSync(migrationsFolder)
  console.log(`📂 Migration files found: ${files.filter((f) => f.endsWith('.sql')).join(', ')}`)

  const metaFolder = resolve(migrationsFolder, 'meta')
  if (!existsSync(metaFolder)) {
    console.error(`❌ Meta folder does not exist: ${metaFolder}`)
    throw new Error(`Meta folder not found: ${metaFolder}`)
  }

  const metaFiles = readdirSync(metaFolder)
  console.log(`📂 Meta files found: ${metaFiles.join(', ')}`)

  // Debug: show applied migrations before
  try {
    const applied = rawDb.query('SELECT hash FROM __drizzle_migrations').all() as { hash: string }[]
    console.log(`📂 Applied migrations before: ${applied.length}`)
  } catch {
    console.log('📂 No migrations table yet')
  }

  migrate(db, { migrationsFolder })

  // Debug: show applied migrations after
  const appliedAfter = rawDb.query('SELECT hash FROM __drizzle_migrations').all() as {
    hash: string
  }[]
  console.log(`📂 Applied migrations after: ${appliedAfter.length}`)

  // Debug: check if columns exist now
  const columnsInfo = rawDb.query('PRAGMA table_info(columns)').all() as { name: string }[]
  const hasIsDone = columnsInfo.some((c) => c.name === 'is_done')
  console.log(`📂 columns.is_done exists: ${hasIsDone}`)

  const cardsInfo = rawDb.query('PRAGMA table_info(cards)').all() as { name: string }[]
  const hasArchivedAt = cardsInfo.some((c) => c.name === 'archived_at')
  console.log(`📂 cards.archived_at exists: ${hasArchivedAt}`)

  console.log('📦 Migrations complete!')
}

// Run migrations directly if this file is executed as a script
if (import.meta.main) {
  runMigrations().catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}
