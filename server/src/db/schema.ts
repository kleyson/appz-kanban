import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'

// Users table
export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name').notNull(),
    role: text('role', { enum: ['admin', 'user'] })
      .notNull()
      .default('user'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('idx_users_username').on(table.username)]
)

// Invites table
export const invites = sqliteTable(
  'invites',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull().unique(),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    usedBy: integer('used_by').references(() => users.id, { onDelete: 'set null' }),
    expiresAt: text('expires_at').notNull(),
    usedAt: text('used_at'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('idx_invites_code').on(table.code)]
)

// Boards table
export const boards = sqliteTable(
  'boards',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    ownerId: integer('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('idx_boards_owner').on(table.ownerId)]
)

// Board members table
export const boardMembers = sqliteTable(
  'board_members',
  {
    boardId: integer('board_id')
      .notNull()
      .references(() => boards.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['owner', 'member'] }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.boardId, table.userId] }),
    index('idx_board_members_user').on(table.userId),
  ]
)

// Columns table
export const columns = sqliteTable(
  'columns',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    boardId: integer('board_id')
      .notNull()
      .references(() => boards.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    position: integer('position').notNull().default(0),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_columns_board').on(table.boardId),
    index('idx_columns_position').on(table.boardId, table.position),
  ]
)

// Labels table
export const labels = sqliteTable(
  'labels',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    boardId: integer('board_id')
      .notNull()
      .references(() => boards.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull(),
  },
  (table) => [index('idx_labels_board').on(table.boardId)]
)

// Cards table
export const cards = sqliteTable(
  'cards',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    columnId: integer('column_id')
      .notNull()
      .references(() => columns.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    position: integer('position').notNull().default(0),
    dueDate: text('due_date'),
    priority: text('priority', { enum: ['low', 'medium', 'high'] }),
    color: text('color'),
    assigneeId: integer('assignee_id').references(() => users.id, { onDelete: 'set null' }),
    subtasks: text('subtasks').default('[]'),
    comments: text('comments').default('[]'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_cards_column').on(table.columnId),
    index('idx_cards_position').on(table.columnId, table.position),
    index('idx_cards_assignee').on(table.assigneeId),
  ]
)

// Card labels junction table
export const cardLabels = sqliteTable(
  'card_labels',
  {
    cardId: integer('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    labelId: integer('label_id')
      .notNull()
      .references(() => labels.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.cardId, table.labelId] }),
    index('idx_card_labels_card').on(table.cardId),
    index('idx_card_labels_label').on(table.labelId),
  ]
)

// User settings table
export const userSettings = sqliteTable('user_settings', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  settings: text('settings').notNull().default('{}'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// Refresh tokens table for persistent sessions
export const refreshTokens = sqliteTable(
  'refresh_tokens',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at').notNull(), // Unix timestamp
    createdAt: integer('created_at').default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_refresh_tokens_user').on(table.userId),
    index('idx_refresh_tokens_token').on(table.token),
  ]
)

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  boards: many(boards),
  boardMemberships: many(boardMembers),
  assignedCards: many(cards),
  settings: many(userSettings),
  createdInvites: many(invites, { relationName: 'createdInvites' }),
  refreshTokens: many(refreshTokens),
}))

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}))

export const invitesRelations = relations(invites, ({ one }) => ({
  creator: one(users, {
    fields: [invites.createdBy],
    references: [users.id],
    relationName: 'createdInvites',
  }),
  usedByUser: one(users, {
    fields: [invites.usedBy],
    references: [users.id],
  }),
}))

export const boardsRelations = relations(boards, ({ one, many }) => ({
  owner: one(users, { fields: [boards.ownerId], references: [users.id] }),
  members: many(boardMembers),
  columns: many(columns),
  labels: many(labels),
}))

export const boardMembersRelations = relations(boardMembers, ({ one }) => ({
  board: one(boards, { fields: [boardMembers.boardId], references: [boards.id] }),
  user: one(users, { fields: [boardMembers.userId], references: [users.id] }),
}))

export const columnsRelations = relations(columns, ({ one, many }) => ({
  board: one(boards, { fields: [columns.boardId], references: [boards.id] }),
  cards: many(cards),
}))

export const labelsRelations = relations(labels, ({ one, many }) => ({
  board: one(boards, { fields: [labels.boardId], references: [boards.id] }),
  cardLabels: many(cardLabels),
}))

export const cardsRelations = relations(cards, ({ one, many }) => ({
  column: one(columns, { fields: [cards.columnId], references: [columns.id] }),
  assignee: one(users, { fields: [cards.assigneeId], references: [users.id] }),
  cardLabels: many(cardLabels),
}))

export const cardLabelsRelations = relations(cardLabels, ({ one }) => ({
  card: one(cards, { fields: [cardLabels.cardId], references: [cards.id] }),
  label: one(labels, { fields: [cardLabels.labelId], references: [labels.id] }),
}))

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, { fields: [userSettings.userId], references: [users.id] }),
}))

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Board = typeof boards.$inferSelect
export type NewBoard = typeof boards.$inferInsert
export type BoardMember = typeof boardMembers.$inferSelect
export type NewBoardMember = typeof boardMembers.$inferInsert
export type Column = typeof columns.$inferSelect
export type NewColumn = typeof columns.$inferInsert
export type Label = typeof labels.$inferSelect
export type NewLabel = typeof labels.$inferInsert
export type Card = typeof cards.$inferSelect
export type NewCard = typeof cards.$inferInsert
export type CardLabel = typeof cardLabels.$inferSelect
export type NewCardLabel = typeof cardLabels.$inferInsert
export type UserSetting = typeof userSettings.$inferSelect
export type NewUserSetting = typeof userSettings.$inferInsert
export type Invite = typeof invites.$inferSelect
export type NewInvite = typeof invites.$inferInsert
export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert
