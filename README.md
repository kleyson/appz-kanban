# Appz Kanban 📋

A modern, real-time Kanban board application built with React and Bun. Manage your projects with drag-and-drop cards, team collaboration, and live updates.

## 🎯 Try the Demo

You can try Appz Kanban without installing anything:

- **Demo URL**: [https://kanban.appz.wtf](https://kanban.appz.wtf)
- **Demo Credentials**:
  - Username: `demo`
  - Password: `demo`

> **Note**: The demo is reset periodically. Any data you enter may be lost.

## ✨ Features

### Core Functionality

- 📋 **Kanban Boards** - Create and manage multiple boards with customizable columns
- 🎴 **Rich Cards** - Cards with titles, descriptions, due dates, priorities, and subtasks
- 🏷️ **Labels** - Organize cards with color-coded labels
- 📱 **Drag & Drop** - Intuitive card and column reordering with [dnd-kit](https://dndkit.com/)
- ✅ **Subtasks** - Break down cards into manageable subtasks

### Team Collaboration

- 👥 **Board Members** - Add members to boards with owner/member roles
- 👤 **Card Assignment** - Assign cards to team members
- 🔄 **Real-time Updates** - WebSocket-powered live synchronization across clients

### User Experience

- 🎨 **Fullscreen Mode** - Display boards in fullscreen with auto-refresh
- ⚙️ **Settings** - Customize default columns, due date warnings, and more
- 🌙 **Dark Mode** - Built-in dark theme support
- 📝 **Markdown Support** - Rich text descriptions with markdown rendering

### Authentication & Security

- 🔐 **User Authentication** - Secure user registration and login with JWT
- 🔒 **Protected Routes** - API endpoints protected with authentication middleware

## Quick Start with Docker

The easiest way to run Appz Kanban is using Docker Compose. No need to clone the repository!

### Prerequisites

- Docker and Docker Compose installed
- At least 512MB of available RAM

### Installation

1. **Download the docker-compose.yml file:**

   ```bash
   wget https://raw.githubusercontent.com/kleyson/appz-kanban/main/docker-compose.yml
   ```

2. **Create a `.env` file (optional but recommended):**

   ```bash
   cat > .env << EOF
   PORT=3000
   JWT_SECRET=your-secret-jwt-key-change-this
   DATABASE_PATH=sqlite://./data/kanban.db
   EOF
   ```

   **Important**: Change `your-secret-jwt-key-change-this` to a strong, random API key!

3. **Start the application:**

   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Open your browser to `http://localhost:3000`
   - Register a new user or use the default admin credentials (if seeded):
     - Username: `admin`
     - Password: `admin`

### Environment Variables

You can customize the application using environment variables in a `.env` file or directly in `docker-compose.yml`:

#### Core Configuration (Required)

- `JWT_SECRET` - Secret key for JWT tokens (**required**, change the default!)
- `PORT` - Port to expose the application (default: `3000`)
- `DATABASE_PATH` - Path to SQLite database file (default: `sqlite://./data/kanban.db`)

### Data Persistence

The application uses Docker volumes to persist data:

- Database is stored in the `appz-kanban-data` volume
- Data persists across container restarts

### Updating

To update to the latest version:

```bash
docker-compose pull
docker-compose up -d
```

### Stopping the Application

```bash
docker-compose down
```

To also remove the data volume (⚠️ this will delete all your data):

```bash
docker-compose down -v
```

## Manual Installation

For development or manual setup:

### Prerequisites

- [Bun](https://bun.sh/) (latest version)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/kleyson/appz-kanban.git
   cd appz-kanban
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Run database migrations:**

   ```bash
   bun run db:migrate
   ```

4. **Start the application:**

   ```bash
   bun run dev
   ```

   This will start:
   - **Client** on `http://localhost:5173`
   - **Server** on `http://localhost:3000`

   You can also run them separately:

   ```bash
   bun run dev:client  # Client only
   bun run dev:server  # Server only
   ```

## Tech Stack

### Backend

- **Runtime**: Bun
- **Framework**: Elysia
- **Database**: SQLite
- **Authentication**: JWT
- **Real-time**: WebSocket

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Drag & Drop**: dnd-kit
- **Markdown**: Marked
- **Emoji**: Emoji Toolkit

## Project Structure

```
appz-kanban/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── api/           # API client and WebSocket
│   │   ├── components/    # React components
│   │   │   ├── auth/     # Authentication pages
│   │   │   ├── board/    # Board components
│   │   │   ├── layout/   # Layout components
│   │   │   └── settings/ # Settings page
│   │   ├── hooks/         # Custom React hooks
│   │   ├── stores/        # Zustand stores
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Backend application
│   ├── src/
│   │   ├── controllers/   # API route handlers
│   │   ├── db/           # Database connection and migrations
│   │   ├── migrations/   # Database migration files
│   │   ├── repositories/ # Data access layer
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Authentication middleware
│   │   └── types/         # TypeScript types
│   ├── data/             # SQLite database files
│   └── package.json
└── package.json          # Root workspace configuration
```

## Available Commands

### Development

```bash
bun run dev              # Start both client and server
bun run dev:client       # Start client only
bun run dev:server       # Start server only
```

### Building

```bash
bun run build            # Build both client and server
```

### Testing

```bash
bun run test             # Run all tests
bun run test:client      # Run client tests only
bun run test:server      # Run server tests only
```

### Code Quality

```bash
bun run typecheck        # Type check all packages
bun run lint             # Lint all code
bun run format           # Check code formatting
bun run verify           # Run typecheck, lint, format, and test
```

### Database

```bash
bun run db:migrate       # Run database migrations
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Boards

- `GET /api/boards` - Get all boards for user
- `POST /api/boards` - Create a new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `POST /api/boards/:id/members` - Add member to board

### Columns

- `POST /api/boards/:boardId/columns` - Create column
- `PUT /api/columns/:id` - Update column
- `DELETE /api/columns/:id` - Delete column
- `PUT /api/boards/:boardId/columns/reorder` - Reorder columns

### Cards

- `POST /api/columns/:columnId/cards` - Create card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `PUT /api/cards/:id/move` - Move card to different column/position

### Labels

- `GET /api/boards/:boardId/labels` - Get board labels
- `POST /api/boards/:boardId/labels` - Create label
- `PUT /api/labels/:id` - Update label
- `DELETE /api/labels/:id` - Delete label

### Settings

- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### WebSocket

- `ws://localhost:3000/ws` - WebSocket connection for real-time updates

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you find this project useful, consider supporting its development:

<a href="https://www.buymeacoffee.com/kleyson" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
