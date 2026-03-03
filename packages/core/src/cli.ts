#!/usr/bin/env node

/**
 * CLI entry point for @deessejs/collections
 *
 * Provides commands for database migrations and schema management
 */

import process from 'process'

import { push, generate, migrate, type MigrationOptions } from './migrations'
import { pgAdapter } from './adapter'

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`
@deessejs/collections CLI

Usage: collections <command> [options]

Commands:
  db:push       Push schema to database (development mode)
  db:generate  Generate migration files
  db:migrate   Apply pending migrations

Global Options:
  --config <path>    Path to collections config file (default: ./collections/config.ts)
  --out <path>      Output directory for migrations (default: ./drizzle)
  --verbose         Enable verbose output
  --dry-run         Dry run mode (only for db:push)

Examples:
  collections db:push
  collections db:push --verbose
  collections db:generate
  collections db:migrate --verbose
  collections db:push --dry-run
`)
}

/**
 * Parse command line arguments
 */
function parseArgs(): {
  command: string | null
  options: MigrationOptions
} {
  const args = process.argv.slice(2)
  const options: MigrationOptions = {
    verbose: false,
    dryRun: false,
    out: './drizzle'
  }

  let command: string | null = null

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === 'db:push' || arg === 'db:generate' || arg === 'db:migrate') {
      command = arg
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--out' || arg === '-o') {
      options.out = args[++i]
    } else if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
  }

  return { command, options }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const { command, options } = parseArgs()

  if (!command) {
    console.error('Error: No command specified')
    printUsage()
    process.exit(1)
  }

  if (options.verbose) {
    console.log('[collections] Command:', command)
    console.log('[collections] Options:', options)
  }

  // Get database URL from environment or prompt
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('Error: DATABASE_URL environment variable is required')
    console.error('Set it with: export DATABASE_URL="postgres://user:pass@localhost:5432/db"')
    process.exit(1)
  }

  const adapter = pgAdapter({ url: dbUrl })

  try {
    switch (command) {
      case 'db:push':
        if (options.verbose) {
          console.log('[collections] Pushing schema to database...')
        }
        await push(adapter, [], options)
        console.log('Schema pushed successfully')
        break

      case 'db:generate':
        if (options.verbose) {
          console.log('[collections] Generating migrations...')
        }
        await generate(adapter, [], options)
        console.log('Migrations generated successfully')
        break

      case 'db:migrate':
        if (options.verbose) {
          console.log('[collections] Applying migrations...')
        }
        await migrate(adapter, options)
        console.log('Migrations applied successfully')
        break

      default:
        console.error(`Error: Unknown command "${command}"`)
        printUsage()
        process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Export for testing
export { main, parseArgs, printUsage }

// Run if executed directly
main()
