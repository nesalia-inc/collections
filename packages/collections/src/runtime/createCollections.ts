/**
 * createCollections - Factory for creating database-backed collections
 *
 * This module provides the main entry point for creating collections with database access.
 * It wires together:
 * - Collections definition
 * - Raw schema building
 * - Drizzle schema creation
 * - Database connection management
 * - DbAccess with CRUD methods
 *
 * @example
 * ```typescript
 * import { createCollections, postgres, collection, field, f } from '@deessejs/collections'
 *
 * const { db, definitions } = createCollections({
 *   collections: [
 *     collection({
 *       slug: 'posts',
 *       fields: {
 *         title: field({ fieldType: f.text() }),
 *       },
 *     }),
 *   ],
 *   db: postgres('postgresql://localhost:5432/mydb'),
 * })
 *
 * // Use db.posts to interact with the posts collection
 * const posts = await db.posts.findMany()
 * ```
 */

import { err, ok, type Result, error } from '@deessejs/core'
import { z } from 'zod'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import { buildRawSchema } from '../adapter/core/buildRawSchema'
import { buildDrizzleTable as buildPostgresDrizzleTable } from '../adapter/postgresql/buildDrizzleTable'
import { buildDrizzleTable as buildSqliteDrizzleTable } from '../adapter/sqlite/buildDrizzleTable'
import { createDbAccess } from '../operations/database/dbAccess'
import type { Collection } from '../collections'
import type { DbAccess } from '../operations/database/types'
import type { GlobalHooks } from './types'

// Note: HookResult and HookHandler types are exported from ./collections/hooks/types
// GlobalHookResult and GlobalHookHandler are exported from ./runtime/types

// ============================================================================
// Error Builders
// ============================================================================

const UnsupportedDatabaseTypeError = error({
  name: 'UnsupportedDatabaseType',
  schema: z.object({
    type: z.string(),
  }),
  message: (args) => `Unsupported database type: ${args.type}`,
})

// ============================================================================
// DbConnection Types
// ============================================================================

/**
 * Database connection configuration for any supported database type
 * eslint-disable-next-line @typescript-eslint/no-explicit-any
 */
export interface DbConnection {
  /** Database type */
  readonly type: 'postgres' | 'sqlite'
  /** Database connection - either a Drizzle database instance or a connection string */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly connection: any
}

// ============================================================================
// Options & Result Types
// ============================================================================

/**
 * Options for creating collections with database access
 * @typeParam TCollections - Tuple type of collection instances
 */
export interface CreateCollectionsOptions<TCollections extends Collection[]> {
  /** Collection definitions */
  readonly collections: TCollections
  /** Database connection configuration */
  readonly db: DbConnection
  /** Optional global hooks that apply to all collections */
  readonly globalHooks?: GlobalHooks
}

/**
 * Extracts the slug (table name) from a Collection type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractSlug<C> = C extends Collection<infer S, any> ? S : never

/**
 * Extracts the Collection type from a Collection instance
 */
type ExtractCollection<C> = C extends Collection<infer S, infer T> ? Collection<S, T> : never

/**
 * Result of creating collections with database access
 * @typeParam TCollections - Tuple type of collection instances
 */
export interface CollectionsResult<TCollections extends Collection[]> {
  /** Database access object with CRUD methods per collection */
  readonly db: DbAccess<TCollections>
  /** Collection definitions mapped by slug */
  readonly definitions: {
    [K in ExtractSlug<TCollections[number]>]: ExtractCollection<TCollections[number]>
  }
}

// ============================================================================
// Connection Helpers
// ============================================================================

/**
 * Create a PostgreSQL database connection
 * @param connection - Either a PgDatabase instance or a connection string
 * @returns DbConnection with type 'postgres'
 *
 * @example
 * ```typescript
 * // Using a connection string
 * const db = postgres('postgresql://user:pass@localhost:5432/mydb')
 *
 * // Using an existing PgDatabase instance
 * const db = postgres(existingPgDatabase)
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const postgres = (connection: any): DbConnection => ({
  type: 'postgres',
  connection,
})

/**
 * Create a SQLite database connection
 * @param connection - Either a SqliteDatabase instance or a connection string (file path)
 * @returns DbConnection with type 'sqlite'
 *
 * @example
 * ```typescript
 * // Using a file path
 * const db = sqlite('./data/mydb.sqlite')
 *
 * // Using an existing SqliteDatabase instance
 * const db = sqlite(existingSqliteDatabase)
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sqlite = (connection: any): DbConnection => ({
  type: 'sqlite',
  connection,
})

// ============================================================================
// Internal context for $push
// ============================================================================

/**
 * Internal context needed for $push() operation
 */
interface PushContext {
  readonly dbType: 'postgres' | 'sqlite'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly drizzleDb: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly rawDb: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly drizzleSchema: Record<string, any>
}

// Store push context for use by $push()
let pushContext: PushContext | null = null

/**
 * $push - Push schema changes to the database (create tables, etc.)
 *
 * This method uses drizzle-kit/api to push the schema to the database.
 * It creates any missing tables and columns but does NOT delete data
 * or make destructive changes.
 *
 * @returns Promise that resolves when push is complete
 *
 * @example
 * ```typescript
 * const { db, definitions } = createCollections(config)
 *
 * // Push schema to create tables before running queries
 * await db.$push()
 *
 * // Now queries will work
 * const posts = await db.posts.findMany()
 * ```
 */
const $push = async (): Promise<void> => {
  if (!pushContext) {
    throw new Error('$push() called before createCollections() was initialized')
  }

  const { dbType, drizzleDb, rawDb, drizzleSchema } = pushContext

  // Dynamic import of drizzle-kit/api
  const { pushSchema, pushSQLiteSchema } = await import('drizzle-kit/api')

  let pushResult
  if (dbType === 'sqlite') {
    pushResult = await pushSQLiteSchema(drizzleSchema, drizzleDb)
    // Apply changes using raw sqlite database exec method
    for (const stmt of pushResult.statementsToExecute) {
      rawDb.exec(stmt)
    }
  } else if (dbType === 'postgres') {
    pushResult = await pushSchema(drizzleSchema, drizzleDb)
    // Apply changes using drizzle db.run
    for (const stmt of pushResult.statementsToExecute) {
      await drizzleDb.run(sql`${stmt}`)
    }
  }
}

// ============================================================================
// createCollections Factory
// ============================================================================

/**
 * Create collections with database access
 *
 * This factory function:
 * 1. Builds the Drizzle schema from collections using buildRawSchema
 * 2. Creates a Drizzle db instance based on db.type
 * 3. Returns DbAccess + definitions for type-safe access
 *
 * @param options - CreateCollectionsOptions containing collections and db connection
 * @returns CollectionsResult with db access and definitions
 *
 * @example
 * ```typescript
 * const { db, definitions } = createCollections({
 *   collections: [
 *     collection({
 *       slug: 'posts',
 *       fields: {
 *         title: field({ fieldType: f.text() }),
 *       },
 *     }),
 *   ],
 *   db: postgres('postgresql://localhost:5432/mydb'),
 * })
 *
 * // Push schema to create tables before running queries
 * await db.$push()
 *
 * // Find many posts
 * const posts = await db.posts.findMany()
 *
 * // Create a post
 * const newPost = await db.posts.create({ data: { title: 'Hello World' } })
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createCollections = <TCollections extends Collection[]>(
  options: CreateCollectionsOptions<TCollections>
): Result<CollectionsResult<TCollections>, ReturnType<typeof UnsupportedDatabaseTypeError>> => {
  const { collections, db: dbConnection } = options

  // Build the raw schema from collections
  const rawSchema = buildRawSchema(collections)

  // Build Drizzle schema and get db instance based on connection type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let drizzleDb: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drizzleSchema: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawDb: any

  if (dbConnection.type === 'postgres') {
    // Build all tables from raw schema
    for (const [name, rawTable] of rawSchema) {
      const result = buildPostgresDrizzleTable(rawTable)
      drizzleSchema[name] = result.table
    }

    // Create drizzle instance with postgres connection
    if (typeof dbConnection.connection === 'string') {
      // Connection string - create pool and drizzle instance
      const pool = new Pool({ connectionString: dbConnection.connection })
      drizzleDb = drizzle(pool, { schema: drizzleSchema })
      rawDb = pool
    } else {
      // Already a PgDatabase instance
      drizzleDb = drizzle(dbConnection.connection, { schema: drizzleSchema })
      rawDb = dbConnection.connection
    }
  } else if (dbConnection.type === 'sqlite') {
    // Build all tables from raw schema
    for (const [name, rawTable] of rawSchema) {
      const result = buildSqliteDrizzleTable(rawTable)
      drizzleSchema[name] = result.table
    }

    // Create drizzle instance with sqlite connection
    if (typeof dbConnection.connection === 'string') {
      // File path - create better-sqlite3 database
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Database = require('better-sqlite3')
      const sqliteDb = new Database(dbConnection.connection)
      drizzleDb = drizzleSqlite(sqliteDb, { schema: drizzleSchema })
      rawDb = sqliteDb
    } else {
      // Already a SqliteDatabase instance
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3')
      drizzleDb = drizzleSqlite(dbConnection.connection, { schema: drizzleSchema })
      rawDb = dbConnection.connection
    }
  } else {
    return err(UnsupportedDatabaseTypeError({ type: dbConnection.type }))
  }

  // Store push context for $push()
  pushContext = {
    dbType: dbConnection.type,
    drizzleDb,
    rawDb,
    drizzleSchema,
  }

  // Create DbAccess with the drizzle instance and schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAccess = createDbAccess(drizzleDb, drizzleSchema as any)

  // Add $push method to dbAccess
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbWithPush = dbAccess as any
  dbWithPush.$push = $push

  // Build definitions object mapping slugs to collection types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const definitions: any = {}
  for (const collection of collections) {
    definitions[collection.slug] = collection
  }

  return ok({
    db: dbWithPush as unknown as DbAccess<TCollections> & { $push: typeof $push },
    definitions: definitions as {
      [K in ExtractSlug<TCollections[number]>]: ExtractCollection<TCollections[number]>
    },
  })
}
