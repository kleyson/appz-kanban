import { Database } from 'bun:sqlite'
import { beforeAll, afterAll, afterEach } from 'bun:test'

// Create in-memory database for tests
export const testDb = new Database(':memory:')

// Enable foreign keys
testDb.run('PRAGMA foreign_keys = ON')

// Run all migrations
function runMigrations() {
  // Users
  testDb.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  testDb.run('CREATE INDEX idx_users_username ON users(username)')

  // Boards
  testDb.run(`
    CREATE TABLE boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      owner_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
  testDb.run('CREATE INDEX idx_boards_owner ON boards(owner_id)')

  // Board members
  testDb.run(`
    CREATE TABLE board_members (
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
  testDb.run(`
    CREATE TABLE columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    )
  `)
  testDb.run('CREATE INDEX idx_columns_board ON columns(board_id)')

  // Labels
  testDb.run(`
    CREATE TABLE labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    )
  `)
  testDb.run('CREATE INDEX idx_labels_board ON labels(board_id)')

  // Cards
  testDb.run(`
    CREATE TABLE cards (
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)
  testDb.run('CREATE INDEX idx_cards_column ON cards(column_id)')

  // Card labels
  testDb.run(`
    CREATE TABLE card_labels (
      card_id INTEGER NOT NULL,
      label_id INTEGER NOT NULL,
      PRIMARY KEY (card_id, label_id),
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    )
  `)

  // User settings
  testDb.run(`
    CREATE TABLE user_settings (
      user_id INTEGER PRIMARY KEY,
      settings TEXT NOT NULL DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
}

beforeAll(() => {
  runMigrations()
})

afterEach(() => {
  // Clean up data after each test but keep tables
  testDb.run('DELETE FROM card_labels')
  testDb.run('DELETE FROM cards')
  testDb.run('DELETE FROM labels')
  testDb.run('DELETE FROM columns')
  testDb.run('DELETE FROM board_members')
  testDb.run('DELETE FROM user_settings')
  testDb.run('DELETE FROM boards')
  testDb.run('DELETE FROM users')
})

afterAll(() => {
  testDb.close()
})

// Helper to create a test user
export function createTestUser(username = 'testuser', displayName = 'Test User') {
  const passwordHash = Bun.password.hashSync('password123')
  const result = testDb.run(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
    [username, passwordHash, displayName]
  )
  return {
    id: Number(result.lastInsertRowid),
    username,
    display_name: displayName,
  }
}

// Helper to create a test board
export function createTestBoard(ownerId: number, name = 'Test Board') {
  const result = testDb.run('INSERT INTO boards (name, owner_id) VALUES (?, ?)', [name, ownerId])
  const boardId = Number(result.lastInsertRowid)

  // Add owner as board member
  testDb.run("INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, 'owner')", [
    boardId,
    ownerId,
  ])

  return { id: boardId, name, owner_id: ownerId }
}

// Helper to create a test column
export function createTestColumn(boardId: number, name = 'Test Column', position = 0) {
  const result = testDb.run('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)', [
    boardId,
    name,
    position,
  ])
  return { id: Number(result.lastInsertRowid), board_id: boardId, name, position }
}

// Helper to create a test card
export function createTestCard(columnId: number, title = 'Test Card', position = 0) {
  const result = testDb.run('INSERT INTO cards (column_id, title, position) VALUES (?, ?, ?)', [
    columnId,
    title,
    position,
  ])
  return { id: Number(result.lastInsertRowid), column_id: columnId, title, position }
}

// Helper to create a test label
export function createTestLabel(boardId: number, name = 'Test Label', color = '#ff0000') {
  const result = testDb.run('INSERT INTO labels (board_id, name, color) VALUES (?, ?, ?)', [
    boardId,
    name,
    color,
  ])
  return { id: Number(result.lastInsertRowid), board_id: boardId, name, color }
}
