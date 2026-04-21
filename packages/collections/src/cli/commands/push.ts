/**
 * Push Command
 *
 * Pushes the schema to the database using drizzle-kit/api.
 *
 * Flow:
 * 1. Load collection.config.ts dynamically
 * 2. Call buildRawSchema(collections) -> Map<string, RawTable>
 * 3. Convert RawTable[] -> Drizzle schema objects
 * 4. Call pushSchema() from drizzle-kit/api
 * 5. Display diff and apply
 */

import { ok, err, error, type Result } from '@deessejs/core'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { loadConfig } from '../utils/loadConfig'
import { buildDrizzleSchema } from '../utils/buildDrizzleSchema'
import type { PushOptions } from '../index'
import type { Collection } from '../../collections'

// ============================================================================
// Error Types
// ============================================================================

const ConfigLoadError = error({
  name: 'ConfigLoadError',
  schema: z.object({
    path: z.string(),
    cause: z.string(),
  }),
  message: (args) => `Failed to load config from ${args.path}: ${args.cause}`,
})

const SchemaBuildError = error({
  name: 'SchemaBuildError',
  schema: z.object({
    cause: z.string(),
  }),
  message: (args) => `Failed to build schema: ${args.cause}`,
})

const PushError = error({
  name: 'PushError',
  schema: z.object({
    cause: z.string(),
  }),
  message: (args) => `Push failed: ${args.cause}`,
})

const DataLossError = error({
  name: 'DataLossError',
  schema: z.object({
    warnings: z.array(z.string()),
  }),
  message: (args) => `Push would cause data loss. Use --force to proceed.\nWarnings:\n${args.warnings.join('\n')}`,
})

export type PushErrorType = ReturnType<typeof ConfigLoadError | typeof SchemaBuildError | typeof PushError | typeof DataLossError>

// ============================================================================
// Push Command
// ============================================================================

/**
 * Push schema changes to the database
 */
export const push = async (options: PushOptions): Promise<Result<Unit, PushErrorType>> => {
  const verbose = options.verbose ?? false
  const configPath = options.config ?? './collection.config.ts'

  if (verbose) {
    console.log('[verbose] Loading config from:', configPath)
  }

  // Step 1: Load config
  const configResult = await loadConfig(configPath)
  if (!configResult.ok) {
    const cause = configResult.error instanceof Error
      ? configResult.error.message
      : typeof configResult.error === 'string'
        ? configResult.error
        : JSON.stringify(configResult.error)
    return err(ConfigLoadError({ path: configPath, cause }))
  }

  const config = configResult.value
  const collections = Object.values(config.collections) as Collection[]
  const dbType = config.db.type

  if (verbose) {
    console.log('[verbose] Loaded', collections.length, 'collections')
    console.log('[verbose] Database type:', dbType)
  }

  // Step 2: Build Drizzle schema
  if (verbose) {
    console.log('[verbose] Building Drizzle schema...')
  }

  const schemaResult = buildDrizzleSchema(collections, dbType)
  if (!schemaResult.ok) {
    return err(SchemaBuildError({ cause: String(schemaResult.error) }))
  }

  const { schema: drizzleSchema } = schemaResult.value

  if (verbose) {
    console.log('[verbose] Schema built with', Object.keys(drizzleSchema).length, 'tables')
  }

  // Step 3: Get database connection
  if (verbose) {
    console.log('[verbose] Connecting to database...')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawDb: any
  try {
    if (dbType === 'postgres') {
      const { Pool } = await import('pg')
      const { drizzle } = await import('drizzle-orm/node-postgres')
      // Use connectionString from config
      const connectionString = config.db.connectionString
      if (!connectionString) {
        return err(PushError({ cause: 'PostgreSQL connection string not found in config' }))
      }
      const pool = new Pool({ connectionString })
      rawDb = pool
      db = drizzle(pool, { schema: drizzleSchema })
    } else if (dbType === 'sqlite') {
      const { drizzle } = await import('drizzle-orm/better-sqlite3')
      const Database = (await import('better-sqlite3')).default
      // Use connectionString as the file path
      const connectionString = config.db.connectionString
      if (!connectionString) {
        return err(PushError({ cause: 'SQLite connection string (file path) not found in config' }))
      }
      const sqliteDb = new Database(connectionString)
      rawDb = sqliteDb
      db = drizzle(sqliteDb, { schema: drizzleSchema })
    } else {
      return err(PushError({ cause: `Unsupported database type: ${dbType}` }))
    }
  } catch (e) {
    return err(PushError({ cause: String(e) }))
  }

  if (verbose) {
    console.log('[verbose] Connected to database')
  }

  // Step 4: Call pushSchema
  if (verbose) {
    console.log('[verbose] Calling pushSchema...')
  }

  try {
    // Dynamic import of drizzle-kit/api
    // Use database-specific push function based on db type
    const { pushSchema, pushSQLiteSchema } = await import('drizzle-kit/api')

    let pushResult
    if (dbType === 'sqlite') {
      pushResult = await pushSQLiteSchema(drizzleSchema, db)
    } else if (dbType === 'postgres') {
      pushResult = await pushSchema(drizzleSchema, db)
    } else {
      return err(PushError({ cause: `Unsupported database type: ${dbType}` }))
    }

    if (verbose) {
      console.log('[verbose] pushSchema completed')
      console.log('[verbose] hasDataLoss:', pushResult.hasDataLoss)
      if (pushResult.warnings.length > 0) {
        console.log('[verbose] Warnings:', pushResult.warnings)
      }
      console.log('[verbose] statementsToExecute:', pushResult.statementsToExecute.length)
    }

    // Check for data loss
    if (pushResult.hasDataLoss && !options.force) {
      return err(DataLossError({ warnings: pushResult.warnings }))
    }

    // Display diff
    console.log('\n=== Schema Push ===\n')
    if (pushResult.statementsToExecute.length === 0) {
      console.log('No changes to apply.')
    } else {
      console.log('Statements to execute:')
      for (const stmt of pushResult.statementsToExecute) {
        console.log('  -', stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''))
      }
      console.log('')

      // Apply changes using raw database
      // Note: pushResult.apply() doesn't work correctly with better-sqlite3
      if (dbType === 'sqlite') {
        // Use raw sqlite database exec method
        for (const stmt of pushResult.statementsToExecute) {
          rawDb.exec(stmt)
        }
      } else {
        // For postgres, use drizzle db.run
        for (const stmt of pushResult.statementsToExecute) {
          await db.run(sql`${stmt}`)
        }
      }
      console.log('Applied', pushResult.statementsToExecute.length, 'statements.')
    }

    return ok({})
  } catch (e) {
    return err(PushError({ cause: String(e) }))
  }
}

// Unit type for void returns
type Unit = Record<never, never>
