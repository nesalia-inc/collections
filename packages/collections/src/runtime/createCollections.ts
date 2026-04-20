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
 * const { db, definitions } = await createCollections({
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
import { buildRawSchema } from '../adapter/core/buildRawSchema'
import { buildDrizzleTable as buildPostgresDrizzleTable } from '../adapter/postgresql/buildDrizzleTable'
import { buildDrizzleTable as buildSqliteDrizzleTable } from '../adapter/sqlite/buildDrizzleTable'
import { buildDrizzleTable as buildMysqlDrizzleTable } from '../adapter/mysql/buildDrizzleTable'
import { createDbAccess } from '../operations/database/dbAccess'
import type { Collection } from '../collections'
import type { DbAccess } from '../operations/database/types'
import type { GlobalHooks } from './types'

// Dynamic imports for database drivers (ESM-compatible)
// These are imported lazily because they are peer dependencies
// that users need to install separately

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

// DbConnectionInput is imported from config/types.ts
// ============================================================================
// DbConnection Types
// ============================================================================

import type { DbConnectionInput } from '../config/types'

// Re-export DbConnectionInput as DbConnection for backwards compatibility
export type { DbConnectionInput as DbConnection } from '../config/types'

// Also import it locally so we can use DbConnection in this file
type DbConnection = DbConnectionInput

// ============================================================================
// Options & Result Types
// ============================================================================

/**
 * Options for PostgreSQL connection
 */
export interface PostgresOptions {
  /** Maximum pool size. Default: 10 */
  max?: number
  /** Idle timeout in ms. Default: 30000 */
  idleTimeoutMillis?: number
}

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
 * @param connection - Connection string (e.g., 'postgresql://user:pass@localhost:5432/mydb')
 * @param options - Optional pool configuration
 * @returns DbConnection with type 'postgres'
 *
 * @example
 * ```typescript
 * // Using a connection string
 * const db = postgres('postgresql://user:pass@localhost:5432/mydb')
 *
 * // Using a connection string with options
 * const db = postgres('postgresql://user:pass@localhost:5432/mydb', {
 *   max: 20,
 *   idleTimeoutMillis: 30000,
 * })
 * ```
 */
export const postgres = (connection: string, options?: PostgresOptions): DbConnection => {
  const pool = new Pool({
    connectionString: connection,
    max: options?.max ?? 10,
    idleTimeoutMillis: options?.idleTimeoutMillis ?? 30000,
  })
  return {
    type: 'postgres',
    connection: pool,
    connectionString: connection,
    options,
  }
}

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

/**
 * Create a MySQL database connection
 * @param connection - Either a MySqlDrizzle Pool instance or a connection string
 * @returns DbConnection with type 'mysql'
 *
 * @example
 * ```typescript
 * // Using a connection string
 * const db = mysql('mysql://user:pass@localhost:3306/mydb')
 *
 * // Using an existing mysql2 Pool instance
 * const db = mysql(existingPool)
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mysql = (connection: any): DbConnection => ({
  type: 'mysql',
  connection,
})

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
 * const { db, definitions } = await createCollections({
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
 * // Find many posts
 * const posts = await db.posts.findMany()
 *
 * // Create a post
 * const newPost = await db.posts.create({ data: { title: 'Hello World' } })
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createCollections = async <TCollections extends Collection[]>(
  options: CreateCollectionsOptions<TCollections>
): Promise<Result<CollectionsResult<TCollections>, ReturnType<typeof UnsupportedDatabaseTypeError>>> => {
  const { collections, db: dbConnection } = options

  // Build the raw schema from collections
  const rawSchema = buildRawSchema(collections)

  // Build Drizzle schema and get db instance based on connection type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let drizzleDb: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drizzleSchema: Record<string, any> = {}

  if (dbConnection.type === 'postgres') {
    // Build all tables from raw schema
    for (const [name, rawTable] of rawSchema) {
      const result = buildPostgresDrizzleTable(rawTable)
      drizzleSchema[name] = result.table
    }

    // Create drizzle instance with postgres connection
    drizzleDb = drizzle(dbConnection.connection, { schema: drizzleSchema })
  } else if (dbConnection.type === 'sqlite') {
    // Build all tables from raw schema
    for (const [name, rawTable] of rawSchema) {
      const result = buildSqliteDrizzleTable(rawTable)
      drizzleSchema[name] = result.table
    }

    // Create drizzle instance with sqlite connection
    // Dynamic import for ESM compatibility
    const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3')
    const Database = (await import('better-sqlite3')).default

    // Check if already a Database instance (e.g., :memory: or existing db)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawDb: any = dbConnection.connection
    if (rawDb instanceof Database) {
      drizzleDb = drizzleSqlite(rawDb, { schema: drizzleSchema })
    } else {
      // File path - create better-sqlite3 database
      const sqliteDb = new Database(rawDb)
      drizzleDb = drizzleSqlite(sqliteDb, { schema: drizzleSchema })
    }
  } else if (dbConnection.type === 'mysql') {
    // Build all tables from raw schema
    for (const [name, rawTable] of rawSchema) {
      const result = buildMysqlDrizzleTable(rawTable)
      drizzleSchema[name] = result.table
    }

    // Dynamic import for ESM compatibility
    const { drizzle } = await import('drizzle-orm/mysql2')
    const mysqlModule = await import('mysql2/promise')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawConnection: any = dbConnection.connection

    // Check if it's a string (connection string) or already a Pool instance
    if (typeof rawConnection === 'string') {
      // Parse connection string
      const url = new URL(rawConnection)
      const pool = mysqlModule.default.createPool({
        host: url.hostname || 'localhost',
        port: parseInt(url.port || '3306', 10),
        user: url.username || 'root',
        password: url.password || '',
        database: url.pathname.slice(1) || 'test',
      })
      drizzleDb = drizzle(pool, { schema: drizzleSchema, mode: 'default' })
    } else {
      // Already a Pool instance - use directly
      drizzleDb = drizzle(rawConnection, { schema: drizzleSchema, mode: 'default' })
    }
  } else {
    return err(UnsupportedDatabaseTypeError({ type: dbConnection.type }))
  }

  // Create DbAccess with the drizzle instance, actual Drizzle schema, and raw schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAccess = createDbAccess(drizzleDb, drizzleSchema, rawSchema as any)

  // Build definitions object mapping slugs to collection types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const definitions: any = {}
  for (const collection of collections) {
    definitions[collection.slug] = collection
  }

  return ok({
    db: dbAccess as unknown as DbAccess<TCollections>,
    definitions: definitions as {
      [K in ExtractSlug<TCollections[number]>]: ExtractCollection<TCollections[number]>
    },
  })
}
