# GitHub Actions Workflows

This directory contains the CI/CD workflows for Appz Kanban.

## Workflows

### `client-lint-format.yml`

Runs on changes to `client/**` directory.

- **Lint**: Runs ESLint on client code
- **Format**: Checks Prettier formatting
- **Type Check**: Validates TypeScript types
- **Build**: Verifies the client builds successfully

### `server-lint-format.yml`

Runs on changes to `server/**` directory.

- **Lint**: Runs ESLint on server code
- **Format**: Checks Prettier formatting
- **Type Check**: Validates TypeScript types
- **Build**: Verifies the server builds successfully

### `test.yml`

Runs on pushes to `main` and pull requests.

- Runs client and server tests
- Builds both client and server to verify compilation

### `release.yml`

Manually triggered workflow for creating releases.

**What it does:**

1. Reads version from `package.json`
2. Creates tag `v{version}` if it doesn't exist
3. Runs tests and builds the application
4. Builds multi-platform Docker image (amd64/arm64)
5. Pushes to GitHub Container Registry
6. Creates GitHub Release with auto-generated notes

## Usage

### Creating a Release

1. Update version in `package.json` (or use `bun run bump:patch`)
2. Commit and push the changes
3. Go to Actions > Create Release > Run workflow

### Required Secrets

- `GITHUB_TOKEN`: Automatically provided
