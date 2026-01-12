import { Database } from 'bun:sqlite'
import { beforeEach } from 'bun:test'

// Each test file gets its own database instance via this factory
let testDbInstance: Database | null = null

export function getTestDb(): Database {
  if (!testDbInstance) {
    testDbInstance = new Database(':memory:')
    testDbInstance.run('PRAGMA foreign_keys = ON')
    runMigrations(testDbInstance)
  }
  return testDbInstance
}

// For backward compatibility
export const testDb = {
  get instance() {
    return getTestDb()
  },
  run(...args: Parameters<Database['run']>) {
    return getTestDb().run(...args)
  },
  query(...args: Parameters<Database['query']>) {
    return getTestDb().query(...args)
  },
}

// Run all migrations
function runMigrations(db: Database) {
  // Users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')

  // Invites
  db.run(`
    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      created_by INTEGER NOT NULL,
      used_by INTEGER,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `)

  // Boards
  db.run(`
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      owner_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
  db.run('CREATE INDEX IF NOT EXISTS idx_boards_owner ON boards(owner_id)')

  // Board members
  db.run(`
    CREATE TABLE IF NOT EXISTS board_members (
      board_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (board_id, user_id),
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Columns
  db.run(`
    CREATE TABLE IF NOT EXISTS columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      is_done INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    )
  `)
  db.run('CREATE INDEX IF NOT EXISTS idx_columns_board ON columns(board_id)')

  // Labels
  db.run(`
    CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    )
  `)
  db.run('CREATE INDEX IF NOT EXISTS idx_labels_board ON labels(board_id)')

  // Cards
  db.run(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      column_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      position INTEGER NOT NULL,
      due_date DATETIME,
      priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
      color TEXT DEFAULT '#0ea5e9',
      assignee_id INTEGER,
      subtasks TEXT DEFAULT '[]',
      comments TEXT DEFAULT '[]',
      archived_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)
  db.run('CREATE INDEX IF NOT EXISTS idx_cards_column ON cards(column_id)')

  // Card labels
  db.run(`
    CREATE TABLE IF NOT EXISTS card_labels (
      card_id INTEGER NOT NULL,
      label_id INTEGER NOT NULL,
      PRIMARY KEY (card_id, label_id),
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    )
  `)

  // User settings
  db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      settings TEXT NOT NULL DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Refresh tokens
  db.run(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
}

// Call this in each test file's describe block to set up proper isolation
export function setupTests() {
  beforeEach(() => {
    const db = getTestDb()
    // Clean up data before each test
    db.run('DELETE FROM card_labels')
    db.run('DELETE FROM cards')
    db.run('DELETE FROM labels')
    db.run('DELETE FROM columns')
    db.run('DELETE FROM board_members')
    db.run('DELETE FROM user_settings')
    db.run('DELETE FROM refresh_tokens')
    db.run('DELETE FROM invites')
    db.run('DELETE FROM boards')
    db.run('DELETE FROM users')
  })
}

// Helper to create a test user
export function createTestUser(username = 'testuser', displayName = 'Test User', role = 'user') {
  const db = getTestDb()
  const passwordHash = Bun.password.hashSync('password123')
  const result = db.run(
    'INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)',
    [username, passwordHash, displayName, role]
  )
  return {
    id: Number(result.lastInsertRowid),
    username,
    display_name: displayName,
    role,
  }
}

// Helper to create a test board
export function createTestBoard(ownerId: number, name = 'Test Board') {
  const db = getTestDb()
  const result = db.run('INSERT INTO boards (name, owner_id) VALUES (?, ?)', [name, ownerId])
  const boardId = Number(result.lastInsertRowid)

  // Add owner as board member
  db.run("INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, 'owner')", [
    boardId,
    ownerId,
  ])

  return { id: boardId, name, owner_id: ownerId }
}

// Helper to create a test column
export function createTestColumn(boardId: number, name = 'Test Column', position = 0) {
  const db = getTestDb()
  const result = db.run('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)', [
    boardId,
    name,
    position,
  ])
  return { id: Number(result.lastInsertRowid), board_id: boardId, name, position }
}

// Helper to create a test card
export function createTestCard(columnId: number, title = 'Test Card', position = 0) {
  const db = getTestDb()
  const result = db.run('INSERT INTO cards (column_id, title, position) VALUES (?, ?, ?)', [
    columnId,
    title,
    position,
  ])
  return { id: Number(result.lastInsertRowid), column_id: columnId, title, position }
}

// Helper to create a test label
export function createTestLabel(boardId: number, name = 'Test Label', color = '#ff0000') {
  const db = getTestDb()
  const result = db.run('INSERT INTO labels (board_id, name, color) VALUES (?, ?, ?)', [
    boardId,
    name,
    color,
  ])
  return { id: Number(result.lastInsertRowid), board_id: boardId, name, color }
}
