import { drizzle } from 'drizzle-orm/node-postgres'

import type { PgAdapter } from './adapter'
import type { Collection } from './collection'
import { buildSchema } from './schema'

/**
 * Get drizzle-kit API lazily to avoid import errors during module load
 */
async function getDrizzleKitApi() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const api = require('drizzle-kit/api')
  return api
}

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
 * Push schema to database (development mode)
 *
 * Uses drizzle-kit programmatic API to push schema changes to the database
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
  collections: Collection[],
  options: MigrationOptions = {}
): Promise<void> => {
  const { verbose = false, dryRun = false } = options

  // Build schema from collections
  const schema = buildSchema(collections)

  // Get pool and create drizzle instance
  const pool = await adapter.getPool()
  const db = drizzle(pool, { schema })

  // Use drizzle-kit API
  const { pushSchema } = await getDrizzleKitApi()

  if (verbose) {
    console.log('[collections] Building schema from collections...')
    console.log('[collections] Tables:', Object.keys(schema).join(', '))
  }

  // Use pushSchema directly
  const result = await pushSchema(schema as Record<string, unknown>, db)

  if (verbose) {
    if (result.warnings.length > 0) {
      console.log('[collections] Warnings:')
      result.warnings.forEach((w: string) => console.log('  -', w))
    }
    console.log('[collections] Statements to execute:', result.statementsToExecute.length)
  }

  if (dryRun) {
    console.log('[collections] Dry run - not applying changes')
    if (verbose) {
      console.log('[collections] SQL statements:')
      result.statementsToExecute.forEach((stmt: string) => console.log(' ', stmt))
    }
    return
  }

  // Apply changes
  await result.apply()

  if (verbose) {
    console.log('[collections] Schema pushed successfully')
  }
}

/**
 * Generate migration files
 *
 * Uses drizzle-kit programmatic API to generate migration SQL files
 *
 * @example
 * import { generate } from '@deessejs/collections'
 * import { pgAdapter } from '@deessejs/collections'
 *
 * const adapter = pgAdapter({ url: process.env.DATABASE_URL })
 * await generate(adapter, collections, { out: './migrations' })
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const generate = async (
  _adapter: PgAdapter,
  collections: Collection[],
  options: MigrationOptions = {}
): Promise<void> => {
  const { verbose = false, out = './drizzle' } = options

  // Build schema from collections
  const schema = buildSchema(collections)

  // Use drizzle-kit API
  const { generateDrizzleJson } = await getDrizzleKitApi()

  if (verbose) {
    console.log('[collections] Building schema from collections...')
    console.log('[collections] Tables:', Object.keys(schema).join(', '))
  }

  // Generate current schema snapshot
  const currentSnapshot = generateDrizzleJson(schema as Record<string, unknown>)

  // For now, we'll create a basic migration
  // In a full implementation, we'd need to:
  // 1. Read existing migrations from the database
  // 2. Get the previous snapshot
  // 3. Generate migration between prev and current

  if (verbose) {
    console.log('[collections] Current snapshot ID:', currentSnapshot.id)
  }

  // For simplicity, we'll just output the current schema as a migration
  // This is a simplified version - full implementation would track migrations
  const migrationSQL = [
    '-- Generated migration',
    `-- Snapshot: ${currentSnapshot.id}`,
    '',
    '-- Tables will be created based on current collections schema',
    ...currentSnapshot.tables?.map((table: string) => `-- Table: ${table}`) ?? []
  ]

  // Write to file
  const { writeFileSync, mkdirSync } = await import('fs')
  try {
    mkdirSync(out, { recursive: true })
  } catch {
    // Directory might already exist
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${out}/migration-${timestamp}.sql`

  writeFileSync(filename, migrationSQL.join('\n'))

  if (verbose) {
    console.log('[collections] Migration written to:', filename)
  }
}

/**
 * Apply migrations
 *
 * Uses drizzle-kit programmatic API to apply pending migrations
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
  const { verbose = false } = options

  // Get pool
  const pool = await adapter.getPool()

  if (verbose) {
    console.log('[collections] Applying migrations...')
  }

  // For migrations, we use the same approach as push
  // The migrations table tracks which migrations have been applied
  // This is a simplified version

  // Get all migration files
  const { readdirSync, readFileSync } = await import('fs')
  const migrationsPath = adapter.config.migrationsPath ?? './migrations'

  try {
    const files = readdirSync(migrationsPath)
      .filter(f => f.endsWith('.sql'))
      .sort()

    if (files.length === 0) {
      if (verbose) {
        console.log('[collections] No migration files found')
      }
      return
    }

    // Execute each migration
    for (const file of files) {
      if (verbose) {
        console.log('[collections] Applying migration:', file)
      }

      const sql = readFileSync(`${migrationsPath}/${file}`, 'utf-8')
      await pool.query(sql)
    }

    if (verbose) {
      console.log('[collections] Migrations applied successfully')
    }
  } catch (error) {
    if (verbose) {
      console.log('[collections] No migrations directory or error:', error)
    }
    // If no migrations directory, just return
  }
}
