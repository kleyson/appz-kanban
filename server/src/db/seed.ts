import { db } from './connection'
import {
  users,
  boards,
  boardMembers,
  columns,
  labels,
  cards,
  cardLabels,
  userSettings,
} from './schema'

// Date helpers
function randomDateInPast(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0)
  return date.toISOString()
}

function randomDateInFuture(daysAhead: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0)
  return date.toISOString()
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, array.length))
}

// Manual data arrays
const BOARD_NAMES = [
  'SaaS Platform',
  'E-commerce Store',
  'Mobile App',
  'Design System',
  'Analytics Dashboard',
  'Content Management',
  'Social Network',
  'Project Management',
  'Customer Portal',
  'Admin Dashboard',
  'Marketing Site',
  'API Gateway',
  'Data Pipeline',
  'User Dashboard',
  'Product Launch',
]

const LABEL_NAMES = [
  'Bug',
  'Feature',
  'Enhancement',
  'Urgent',
  'Design',
  'Backend',
  'Frontend',
  'Documentation',
  'Testing',
  'Performance',
  'Security',
  'Refactor',
]

const CARD_TITLES = [
  'Implement user authentication',
  'Design login page',
  'Add dark mode support',
  'Fix responsive layout issues',
  'Create API endpoints',
  'Set up database migrations',
  'Write unit tests',
  'Update documentation',
  'Optimize image loading',
  'Add error handling',
  'Implement search functionality',
  'Create user profile page',
  'Add notification system',
  'Fix memory leaks',
  'Improve accessibility',
  'Add internationalization',
  'Create admin dashboard',
  'Implement file upload',
  'Add real-time updates',
  'Optimize database queries',
  'Create landing page',
  'Add payment integration',
  'Implement analytics',
  'Add social sharing',
  'Create mobile app',
  'Fix cross-browser issues',
  'Add caching layer',
  'Implement rate limiting',
  'Create user onboarding',
  'Add email notifications',
  'Implement two-factor auth',
  'Create API documentation',
  'Add data export feature',
  'Implement audit logging',
  'Create backup system',
  'Add monitoring dashboard',
  'Implement feature flags',
  'Create user feedback system',
  'Add video player',
  'Implement chat system',
  'Create reporting module',
  'Add calendar integration',
  'Implement task automation',
  'Create data visualization',
  'Add export functionality',
  'Implement SSO',
  'Create mobile responsive design',
  'Add keyboard shortcuts',
  'Implement drag and drop',
  'Create wizard flow',
]

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F43F5E', // Rose
  '#A855F7', // Violet
  '#0EA5E9', // Sky
  '#64748B', // Slate
]

const PRIORITIES: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']

async function seed() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Clearing existing data...')
  await db.delete(cardLabels)
  await db.delete(cards)
  await db.delete(labels)
  await db.delete(columns)
  await db.delete(boardMembers)
  await db.delete(boards)
  await db.delete(userSettings)
  await db.delete(users)

  // Create users (from past to present)
  console.log('👥 Creating users...')
  const userNames = [
    'alice_designer',
    'bob_developer',
    'charlie_product',
    'diana_ux',
    'eve_manager',
    'frank_engineer',
    'grace_designer',
    'henry_lead',
    'ivy_researcher',
    'jack_architect',
  ]

  const createdUsers = []
  for (let i = 0; i < userNames.length; i++) {
    const username = userNames[i]
    const displayName = username
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    const passwordHash = await Bun.password.hash('password123', { algorithm: 'bcrypt', cost: 10 })
    const createdAt = randomDateInPast(randomBetween(180, 30)) // 30-180 days ago

    const [user] = await db
      .insert(users)
      .values({
        username,
        passwordHash,
        displayName,
        createdAt,
      })
      .returning()

    createdUsers.push(user)

    // Create user settings
    await db.insert(userSettings).values({
      userId: user.id,
      settings: JSON.stringify({
        defaultDueDays: randomBetween(1, 7),
        defaultColumns: ['To Do', 'In Progress', 'Review', 'Done'],
        dueDateWarnings: {
          urgent: 1,
          warning: 24,
          approaching: 72,
        },
        fullscreen: {
          autoRefreshInterval: randomBetween(10, 60),
          showClock: Math.random() > 0.5,
        },
      }),
      updatedAt: createdAt,
    })
  }

  console.log(`✅ Created ${createdUsers.length} users`)

  // Create boards
  console.log('📋 Creating boards...')
  const createdBoards = []
  const boardMemberMap = new Map<number, number[]>() // boardId -> userId[]

  for (let i = 0; i < BOARD_NAMES.length; i++) {
    const boardName = BOARD_NAMES[i]
    const owner = randomItem(createdUsers)
    const createdAt = randomDateInPast(randomBetween(120, 10)) // 10-120 days ago
    const updatedAt = randomDateInPast(randomBetween(5, 0)) // 0-5 days ago

    const [board] = await db
      .insert(boards)
      .values({
        name: boardName,
        ownerId: owner.id,
        createdAt,
        updatedAt,
      })
      .returning()

    createdBoards.push(board)

    // Track board members
    const memberIds = [owner.id]

    // Add owner as board member
    await db.insert(boardMembers).values({
      boardId: board.id,
      userId: owner.id,
      role: 'owner',
    })

    // Add 2-4 random members
    const otherMembers = randomItems(
      createdUsers.filter((u) => u.id !== owner.id),
      randomBetween(2, 4)
    )
    for (const member of otherMembers) {
      memberIds.push(member.id)
      await db.insert(boardMembers).values({
        boardId: board.id,
        userId: member.id,
        role: 'member',
      })
    }

    boardMemberMap.set(board.id, memberIds)
  }

  console.log(`✅ Created ${createdBoards.length} boards`)

  // Create columns for each board
  console.log('📑 Creating columns...')
  const createdColumns = []
  const defaultColumnNames = ['To Do', 'In Progress', 'Review', 'Done', 'Backlog']

  for (const board of createdBoards) {
    const columnCount = randomBetween(3, 5)
    const columnNames = defaultColumnNames.slice(0, columnCount)

    for (let pos = 0; pos < columnNames.length; pos++) {
      const [column] = await db
        .insert(columns)
        .values({
          boardId: board.id,
          name: columnNames[pos],
          position: pos,
          createdAt: board.createdAt,
        })
        .returning()

      createdColumns.push(column)
    }
  }

  console.log(`✅ Created ${createdColumns.length} columns`)

  // Create labels for each board
  console.log('🏷️  Creating labels...')
  const createdLabels = []

  for (const board of createdBoards) {
    const labelCount = randomBetween(3, 6)
    const selectedLabels = randomItems(LABEL_NAMES, labelCount)

    for (const labelName of selectedLabels) {
      const color = randomItem(COLORS)

      const [label] = await db
        .insert(labels)
        .values({
          boardId: board.id,
          name: labelName,
          color,
        })
        .returning()

      createdLabels.push(label)
    }
  }

  console.log(`✅ Created ${createdLabels.length} labels`)

  // Create cards
  console.log('🎴 Creating cards...')
  const createdCards = []
  let cardPosition = 0

  for (const column of createdColumns) {
    const board = createdBoards.find((b) => b.id === column.boardId)!
    const boardLabels = createdLabels.filter((l) => l.boardId === board.id)
    const boardMemberIds = boardMemberMap.get(board.id) || [board.ownerId]
    const boardMemberUsers = createdUsers.filter((u) => boardMemberIds.includes(u.id))

    const cardsInColumn = randomBetween(2, 8)
    cardPosition = 0

    for (let i = 0; i < cardsInColumn; i++) {
      const title = randomItem(CARD_TITLES)
      const description =
        Math.random() > 0.5 ? `${title} - Detailed description and requirements.` : null
      const priority = Math.random() > 0.3 ? randomItem(PRIORITIES) : null
      const color = Math.random() > 0.5 ? randomItem(COLORS) : null

      // Mix of past and future due dates
      let dueDate: string | null = null
      if (Math.random() > 0.4) {
        if (Math.random() > 0.5) {
          // Future dates
          dueDate = randomDateInFuture(randomBetween(1, 90))
        } else {
          // Past dates (overdue)
          dueDate = randomDateInPast(randomBetween(1, 30))
        }
      }

      const assignee =
        Math.random() > 0.4 && boardMemberUsers.length > 0 ? randomItem(boardMemberUsers) : null
      const createdAt = randomDateInPast(randomBetween(60, 1))
      const updatedAt = randomDateInPast(randomBetween(5, 0))

      // Create subtasks
      const subtaskCount = Math.random() > 0.6 ? randomBetween(1, 4) : 0
      const subtasks = []
      for (let j = 0; j < subtaskCount; j++) {
        subtasks.push({
          id: `subtask-${j}`,
          title: `Subtask ${j + 1}`,
          completed: Math.random() > 0.5,
        })
      }

      const [card] = await db
        .insert(cards)
        .values({
          columnId: column.id,
          title,
          description,
          position: cardPosition++,
          dueDate,
          priority,
          color,
          assigneeId: assignee?.id || null,
          subtasks: JSON.stringify(subtasks),
          createdAt,
          updatedAt,
        })
        .returning()

      createdCards.push(card)

      // Add 0-3 labels to card
      if (boardLabels.length > 0 && Math.random() > 0.3) {
        const cardLabelCount = randomBetween(1, Math.min(3, boardLabels.length))
        const selectedLabels = randomItems(boardLabels, cardLabelCount)

        for (const label of selectedLabels) {
          await db.insert(cardLabels).values({
            cardId: card.id,
            labelId: label.id,
          })
        }
      }
    }
  }

  console.log(`✅ Created ${createdCards.length} cards`)

  // Summary
  console.log('\n📊 Seed Summary:')
  console.log(`   Users: ${createdUsers.length}`)
  console.log(`   Boards: ${createdBoards.length}`)
  console.log(`   Columns: ${createdColumns.length}`)
  console.log(`   Labels: ${createdLabels.length}`)
  console.log(`   Cards: ${createdCards.length}`)
  console.log('\n✨ Database seeded successfully!')
}

// Run seed
seed()
  .then(() => {
    console.log('✅ Seed completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
