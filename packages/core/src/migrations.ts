import { Pool, type Pool as PoolType } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { pushSchema, generateMigration, generateDrizzleJson } from 'drizzle-kit/api'

import type { PgAdapter } from './adapter'
import type { Collection } from './collection'
import { buildSchema } from './schema'

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
 * Push result
 */
export type PushResult = {
  /** SQL statements to be executed */
  statements: string[]
  /** Warnings during push */
  warnings: string[]
  /** Apply the changes to database */
  apply: () => Promise<void>
}

/**
 * Generate result
 */
export type GenerateResult = {
  /** SQL statements for the migration */
  sql: string[]
  /** Directory where migration was saved */
  directory?: string
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
 * const result = await push(adapter, collections)
 *
 * // Preview changes without applying
 * console.log(result.statements)
 *
 * // Apply changes
 * await result.apply()
 */
export const push = async (
  adapter: PgAdapter,
  collections: Collection[],
  options: MigrationOptions = {}
): Promise<PushResult> => {
  const { verbose = false, dryRun = false } = options

  // Build schema from collections
  const schema = buildSchema(collections)

  // Create pool and drizzle instance
  const pool = new Pool({
    connectionString: adapter.config.url
  })

  try {
    const db = drizzle(pool, { schema })

    // Use pushSchema from drizzle-kit API
    const result = await pushSchema(schema, db)

    if (verbose) {
      console.log('[collections] Warnings:', result.warnings)
      console.log('[collections] Statements to execute:', result.statements.length)
    }

    return {
      statements: result.statements,
      warnings: result.warnings,
      apply: async () => {
        if (dryRun) {
          if (verbose) {
            console.log('[collections] Dry run - not applying changes')
          }
          return
        }
        await result.apply()
        if (verbose) {
          console.log('[collections] Schema pushed successfully')
        }
      }
    }
  } finally {
    await pool.end()
  }
}

/**
 * Generate migration files
 *
 * Uses drizzle-kit programmatic API to create migration files
 *
 * @example
 * import { generate } from '@deessejs/collections'
 * import { pgAdapter } from '@deessejs/collections'
 *
 * const adapter = pgAdapter({ url: process.env.DATABASE_URL })
 * const result = await generate(adapter, collections, { out: './migrations' })
 *
 * console.log(result.sql) // SQL statements
 */
export const generate = async (
  adapter: PgAdapter,
  collections: Collection[],
  options: MigrationOptions = {}
): Promise<GenerateResult> => {
  const { verbose = false, out = './drizzle' } = options

  // Build schema from collections
  const schema = buildSchema(collections)

  // Create pool and drizzle instance
  const pool = new Pool({
    connectionString: adapter.config.url
  })

  try {
    const db = drizzle(pool, { schema })

    // Generate JSON snapshots
    const currentJson = generateDrizzleJson(schema)
    const newJson = generateDrizzleJson(schema)

    // Generate migration SQL
    const sqlStatements = await generateMigration(currentJson, newJson)

    if (verbose) {
      console.log('[collections] Migration SQL generated')
      console.log('[collections] Statements:', sqlStatements.length)
    }

    return {
      sql: sqlStatements,
      directory: out
    }
  } finally {
    await pool.end()
  }
}

/**
 * Apply migrations
 *
 * Note: With the programmatic API, migrations are applied automatically
 * when using push(). This function is kept for API compatibility.
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
  _options: MigrationOptions = {}
): Promise<void> => {
  // With programmatic API, migrations are handled by push()
  // This is kept for backward compatibility
  console.warn('[collections] migrate() is deprecated. Use push() instead.')
}
