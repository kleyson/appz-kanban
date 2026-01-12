// Error codes for contextual error messages
export enum ErrorCode {
  // Auth errors
  USERNAME_TAKEN = 'USERNAME_TAKEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_INVITE = 'INVALID_INVITE',
  INVITE_EXPIRED = 'INVITE_EXPIRED',
  INVITE_ALREADY_USED = 'INVITE_ALREADY_USED',
  REGISTRATION_DISABLED = 'REGISTRATION_DISABLED',

  // Validation errors
  USERNAME_TOO_SHORT = 'USERNAME_TOO_SHORT',
  PASSWORD_TOO_SHORT = 'PASSWORD_TOO_SHORT',
  DISPLAY_NAME_REQUIRED = 'DISPLAY_NAME_REQUIRED',

  // Permission errors
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  NOT_ADMIN = 'NOT_ADMIN',
  NOT_BOARD_OWNER = 'NOT_BOARD_OWNER',
  NOT_BOARD_MEMBER = 'NOT_BOARD_MEMBER',

  // Resource errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  BOARD_NOT_FOUND = 'BOARD_NOT_FOUND',
  COLUMN_NOT_FOUND = 'COLUMN_NOT_FOUND',
  CARD_NOT_FOUND = 'CARD_NOT_FOUND',
  INVITE_NOT_FOUND = 'INVITE_NOT_FOUND',
}

// Custom error class with code
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// User types
export type UserRole = 'admin' | 'user'

export interface User {
  id: number
  username: string
  passwordHash: string
  displayName: string
  role: UserRole
  createdAt: string
}

export interface UserPublic {
  id: number
  username: string
  displayName: string
  role: UserRole
}

// Invite types
export interface Invite {
  id: number
  code: string
  createdBy: number
  usedBy: number | null
  expiresAt: string
  usedAt: string | null
  createdAt: string
}

export interface InviteWithCreator extends Invite {
  creator?: UserPublic
}

// Board types
export interface Board {
  id: number
  name: string
  ownerId: number
  createdAt: string
  updatedAt: string
}

export interface BoardWithDetails extends Board {
  columns: ColumnWithCards[]
  members: BoardMember[]
  labels: Label[]
}

// Board member types
export interface BoardMember {
  boardId: number
  userId: number
  role: 'owner' | 'member'
  user?: UserPublic
}

// Column types
export interface Column {
  id: number
  boardId: number
  name: string
  position: number
  isDone: boolean
  createdAt: string
}

export interface ColumnWithCards extends Column {
  cards: Card[]
}

// Label types
export interface Label {
  id: number
  boardId: number
  name: string
  color: string
}

// Card types
export type Priority = 'low' | 'medium' | 'high'

export interface Card {
  id: number
  columnId: number
  title: string
  description: string | null
  position: number
  dueDate: string | null
  priority: Priority | null
  color: string | null
  assigneeId: number | null
  subtasks: Subtask[]
  comments: Comment[]
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  labels?: Label[]
  assignee?: UserPublic | null
}

// API request/response types
export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  displayName: string
  inviteCode?: string
}

export interface AuthResponse {
  token: string
  user: UserPublic
}

export interface CreateBoardRequest {
  name: string
}

export interface CreateColumnRequest {
  name: string
}

export interface CreateCardRequest {
  title: string
  description?: string
  dueDate?: string
  priority?: Priority
  color?: string
  assigneeId?: number
  labelIds?: number[]
  subtasks?: Subtask[]
  comments?: Comment[]
}

export interface UpdateCardRequest {
  title?: string
  description?: string | null
  dueDate?: string | null
  priority?: Priority | null
  color?: string | null
  assigneeId?: number | null
  labelIds?: number[]
  subtasks?: Subtask[]
  comments?: Comment[]
}

export interface MoveCardRequest {
  columnId: number
  position: number
}

export interface ReorderColumnsRequest {
  columnIds: number[]
}

export interface CreateLabelRequest {
  name: string
  color: string
}

export interface AddMemberRequest {
  username: string
}

// Subtask types
export interface Subtask {
  id: string
  title: string
  completed: boolean
}

// Comment types
export interface Comment {
  id: string
  content: string
  authorId: number
  authorName: string
  createdAt: string
  updatedAt?: string
}

// Settings types
export interface DueDateWarnings {
  urgent: number // hours
  warning: number // hours
  approaching: number // hours
}

export interface FullscreenSettings {
  autoRefreshInterval: number // seconds
  showClock: boolean
}

export interface CardRottingSettings {
  enabled: boolean
  thresholds: {
    slight: number // days until slight rot
    medium: number // days until medium rot
    heavy: number // days until heavy rot
  }
}

// Webhook event types
export type WebhookEvent =
  | 'card.created'
  | 'card.updated'
  | 'card.moved'
  | 'card.deleted'
  | 'card.archived'
  | 'card.unarchived'
  | 'column.created'
  | 'column.deleted'
  | 'board.created'
  | 'label.created'

export interface WebhookSettings {
  enabled: boolean
  url: string
  secret: string // For HMAC signature verification
  events: WebhookEvent[]
}

export interface UserSettings {
  defaultDueDays: number
  defaultColumns: string[]
  dueDateWarnings: DueDateWarnings
  fullscreen: FullscreenSettings
  cardRotting: CardRottingSettings
  webhook: WebhookSettings
}

export const DEFAULT_SETTINGS: UserSettings = {
  defaultDueDays: 3,
  defaultColumns: ['To Do', 'In Progress', 'Review', 'Done'],
  dueDateWarnings: {
    urgent: 1,
    warning: 24,
    approaching: 72,
  },
  fullscreen: {
    autoRefreshInterval: 30,
    showClock: true,
  },
  cardRotting: {
    enabled: true,
    thresholds: {
      slight: 3,
      medium: 7,
      heavy: 14,
    },
  },
  webhook: {
    enabled: false,
    url: '',
    secret: '',
    events: [],
  },
}
