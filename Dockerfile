# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install dependencies (skip postinstall hooks - lefthook needs git)
RUN bun install --frozen-lockfile --ignore-scripts

# Copy source files
COPY . .

# Build client and server
RUN bun run build

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy built client
COPY --from=builder /app/client/dist ./client/dist

# Copy server files
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/kanban.db

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start server
CMD ["bun", "run", "server/dist/index.js"]
