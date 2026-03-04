import { spawn } from 'child_process'
import { resolve } from 'path'
import process from 'process'

import type { PgAdapter } from './adapter'
import type { Collection } from './collection'

/**
 * Migration options
 */
export type MigrationOptions = {
  /** Output directory for generated files */
  out?: string
  /** Enable verbose output */
  verbose?: boolean
  /** Dry run mode - don't apply changes */
  dryRun?: boolean
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
}): string {
  const config: Record<string, unknown> = {
    dialect: 'postgresql',
    schema: options.schemaPath,
    out: options.out,
    dbCredentials: {
      url: options.dbUrl
    }
  }

  return JSON.stringify(config, null, 2)
}

/**
 * Push schema to database (development mode)
 *
 * Uses drizzle-kit CLI to push schema changes to the database
 *
 * @example
 * import { push } from '@deessejs/collections'
 * import { pgAdapter } from '@deessejs/collections'
 *
 * const adapter = pgAdapter({ url: process.env.DATABASE_URL })
 * await push(adapter, collections)
 */
export const push = async (
  adapter: PgAdapter,
  _collections: Collection[],
  options: MigrationOptions = {}
): Promise<void> => {
  const {
    verbose = false,
    dryRun = false,
    out = './drizzle'
  } = options

  // Build temporary drizzle config
  const configContent = buildDrizzleConfig({
    out,
    schemaPath: './collections/config.ts',
    dbUrl: adapter.config.url
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
 *
 * @example
 * import { generate } from '@deessejs/collections'
 * import { pgAdapter } from '@deessejs/collections'
 *
 * const adapter = pgAdapter({ url: process.env.DATABASE_URL })
 * await generate(adapter, collections, { out: './migrations' })
 */
export const generate = async (
  adapter: PgAdapter,
  _collections: Collection[],
  options: MigrationOptions = {}
): Promise<void> => {
  const {
    verbose = false,
    out = './drizzle'
  } = options

  // Build temporary drizzle config
  const configContent = buildDrizzleConfig({
    out,
    schemaPath: './collections/config.ts',
    dbUrl: adapter.config.url
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
 *
 * @example
 * import { migrate } from '@deessejs/collections'
 * import { pgAdapter } from '@deessejs/collections'
 *
 * const adapter = pgAdapter({ url: process.env.DATABASE_URL })
 * await migrate(adapter)
 */
export const migrate = async (
  adapter: PgAdapter,
  options: MigrationOptions = {}
): Promise<void> => {
  const {
    verbose = false,
    out = './drizzle'
  } = options

  // Build temporary drizzle config
  const configContent = buildDrizzleConfig({
    out,
    schemaPath: './collections/config.ts',
    dbUrl: adapter.config.url
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
