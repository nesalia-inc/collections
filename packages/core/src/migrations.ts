import { spawn } from 'child_process'
import { resolve } from 'path'
import process from 'process'

import type { PgAdapter } from './adapter'
import type { Collection } from './collection'

/**
 * Migration options
 */
export type MigrationOptions = {
  /** Path to the config file */
  configPath?: string
  /** Output directory for generated files */
  out?: string
  /** Enable verbose output */
  verbose?: boolean
  /** Dry run mode - don't apply changes */
  dryRun?: boolean
  /** Custom migrations table name */
  migrationsTable?: string
}

/**
 * Run a command and return a promise
 */
function runCommand(command: string, args: string[], options: { verbose?: boolean } = {}): Promise<number> {
  return new Promise((resolve, reject) => {
    if (options.verbose) {
      console.log(`[collections] Running: ${command} ${args.join(' ')}`)
    }

    const child = spawn(command, args, {
      stdio: options.verbose ? 'inherit' : 'pipe',
      shell: true,
      cwd: process.cwd()
    })

    let output = ''
    if (!options.verbose) {
      child.stdout?.on('data', (data) => {
        output += data.toString()
      })
      child.stderr?.on('data', (data) => {
        output += data.toString()
      })
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code ?? 0)
      } else {
        reject(new Error(`Command failed with code ${code}: ${output}`))
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * Build drizzle-kit config file content
 */
function buildDrizzleConfig(options: {
  out: string
  schemaPath: string
  dbUrl: string
  migrationsTable?: string
}): string {
  const config: Record<string, unknown> = {
    dialect: 'postgresql',
    schema: options.schemaPath,
    out: options.out,
    dbCredentials: {
      url: options.dbUrl
    }
  }

  if (options.migrationsTable) {
    config.migrations = {
      table: options.migrationsTable
    }
  }

  return JSON.stringify(config, null, 2)
}

/**
 * Push schema to database (development mode)
 *
 * Uses drizzle-kit CLI to push schema changes to the database
 */
export const push = async (
  adapter: PgAdapter,
  _collections: Collection[],
  options: MigrationOptions = {}
): Promise<void> => {
  const {
    verbose = false,
    dryRun = false,
    out = './drizzle',
    configPath = './collections/config.ts',
    migrationsTable = '__drizzle_collections'
  } = options

  // Build temporary drizzle config
  const configContent = buildDrizzleConfig({
    out,
    schemaPath: configPath,
    dbUrl: adapter.config.url,
    migrationsTable
  })

  const drizzleConfigPath = resolve(process.cwd(), './drizzle.config.json')
  const { writeFileSync, unlinkSync } = await import('fs')

  try {
    // Write config file
    writeFileSync(drizzleConfigPath, configContent)

    const args = ['drizzle-kit', 'push']

    if (dryRun) {
      args.push('--dry-run')
    }

    if (verbose) {
      args.push('--verbose')
    }

    await runCommand('npx', args, { verbose })

    if (verbose) {
      console.log('[collections] Schema pushed successfully')
    }
  } finally {
    // Cleanup config file
    try {
      unlinkSync(drizzleConfigPath)
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Generate migration files
 *
 * Uses drizzle-kit CLI to create migration files
 */
export const generate = async (
  adapter: PgAdapter,
  _collections: Collection[],
  options: MigrationOptions = {}
): Promise<void> => {
  const {
    verbose = false,
    out = './drizzle',
    configPath = './collections/config.ts',
    migrationsTable = '__drizzle_collections'
  } = options

  // Build temporary drizzle config
  const configContent = buildDrizzleConfig({
    out,
    schemaPath: configPath,
    dbUrl: adapter.config.url,
    migrationsTable
  })

  const drizzleConfigPath = resolve(process.cwd(), './drizzle.config.json')
  const { writeFileSync, unlinkSync } = await import('fs')

  try {
    // Write config file
    writeFileSync(drizzleConfigPath, configContent)

    const args = ['drizzle-kit', 'generate']

    if (verbose) {
      args.push('--verbose')
    }

    await runCommand('npx', args, { verbose })

    if (verbose) {
      console.log('[collections] Migrations generated successfully')
    }
  } finally {
    // Cleanup config file
    try {
      unlinkSync(drizzleConfigPath)
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Apply migrations
 *
 * Uses drizzle-kit CLI to apply pending migrations
 */
export const migrate = async (
  adapter: PgAdapter,
  options: MigrationOptions = {}
): Promise<void> => {
  const {
    verbose = false,
    out = './drizzle',
    configPath = './collections/config.ts',
    migrationsTable = '__drizzle_collections'
  } = options

  // Build temporary drizzle config
  const configContent = buildDrizzleConfig({
    out,
    schemaPath: configPath,
    dbUrl: adapter.config.url,
    migrationsTable
  })

  const drizzleConfigPath = resolve(process.cwd(), './drizzle.config.json')
  const { writeFileSync, unlinkSync } = await import('fs')

  try {
    // Write config file
    writeFileSync(drizzleConfigPath, configContent)

    const args = ['drizzle-kit', 'migrate']

    if (verbose) {
      args.push('--verbose')
    }

    await runCommand('npx', args, { verbose })

    if (verbose) {
      console.log('[collections] Migrations applied successfully')
    }
  } finally {
    // Cleanup config file
    try {
      unlinkSync(drizzleConfigPath)
    } catch {
      // Ignore cleanup errors
    }
  }
}
