#!/usr/bin/env bun
/**
 * Version bump script
 * Usage: bun scripts/bump-version.ts [patch|minor|major]
 *
 * This script will:
 * 1. Bump the version in package.json
 * 2. Create a git commit with the version change
 * 3. Create a git tag with the version
 * 4. Push the commit and tag to remote
 */

import { $ } from 'bun'

type BumpType = 'patch' | 'minor' | 'major'

function parseVersion(version: string): [number, number, number] {
  const parts = version.split('.').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${version}`)
  }
  return parts as [number, number, number]
}

function bumpVersion(version: string, type: BumpType): string {
  const [major, minor, patch] = parseVersion(version)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
  }
}

async function main() {
  const args = process.argv.slice(2)
  const bumpType = (args[0] as BumpType) || 'patch'

  if (!['patch', 'minor', 'major'].includes(bumpType)) {
    console.error('Usage: bun scripts/bump-version.ts [patch|minor|major]')
    console.error('  patch - Bump patch version (1.0.0 -> 1.0.1)')
    console.error('  minor - Bump minor version (1.0.0 -> 1.1.0)')
    console.error('  major - Bump major version (1.0.0 -> 2.0.0)')
    process.exit(1)
  }

  // Check for uncommitted changes
  const status = await $`git status --porcelain`.text()
  if (status.trim()) {
    console.error('Error: You have uncommitted changes. Please commit or stash them first.')
    process.exit(1)
  }

  // Read current version
  const packageJson = await Bun.file('package.json').json()
  const currentVersion = packageJson.version
  const newVersion = bumpVersion(currentVersion, bumpType)

  console.log(`Bumping version: ${currentVersion} -> ${newVersion}`)

  // Update package.json
  packageJson.version = newVersion
  await Bun.write('package.json', JSON.stringify(packageJson, null, 2) + '\n')

  // Also update server/package.json and client/package.json if they exist
  try {
    const serverPkg = await Bun.file('server/package.json').json()
    serverPkg.version = newVersion
    await Bun.write('server/package.json', JSON.stringify(serverPkg, null, 2) + '\n')
    console.log('Updated server/package.json')
  } catch {
    // Server package.json doesn't exist or couldn't be updated
  }

  try {
    const clientPkg = await Bun.file('client/package.json').json()
    clientPkg.version = newVersion
    await Bun.write('client/package.json', JSON.stringify(clientPkg, null, 2) + '\n')
    console.log('Updated client/package.json')
  } catch {
    // Client package.json doesn't exist or couldn't be updated
  }

  // Create commit
  console.log('Creating commit...')
  await $`git add package.json server/package.json client/package.json`
  await $`git commit -m "chore: bump version to ${newVersion}"`

  // Create tag
  console.log(`Creating tag v${newVersion}...`)
  await $`git tag -a v${newVersion} -m "Release v${newVersion}"`

  // Push to remote
  console.log('Pushing to remote...')
  await $`git push`
  await $`git push --tags`

  console.log(`\nSuccessfully released v${newVersion}!`)
}

main().catch((error) => {
  console.error('Error:', error.message)
  process.exit(1)
})
