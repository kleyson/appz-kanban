// User types
export interface User {
  id: number
  username: string
  passwordHash: string
  displayName: string
  createdAt: string
}

export interface UserPublic {
  id: number
  username: string
  displayName: string
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
