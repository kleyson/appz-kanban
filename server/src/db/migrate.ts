import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { resolve } from 'path'
import { existsSync, readdirSync } from 'fs'
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

  migrate(db, { migrationsFolder })

  console.log('📦 Migrations complete!')
}

// Run migrations directly if this file is executed as a script
if (import.meta.main) {
  runMigrations().catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}
