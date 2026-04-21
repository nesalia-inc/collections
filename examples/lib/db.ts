/**
 * Common Database Connection Utilities
 *
 * This module provides reusable database connection helpers for examples.
 * Each helper creates and manages the appropriate database connection
 * with proper typing and environment variable support.
 *
 * @example
 * ```typescript
 * // SQLite (in-memory or file)
 * const { db: sqliteDb } = createSqliteConnection()
 * const { db: sqliteDb } = createSqliteConnection({ path: './data.db' })
 *
 * // PostgreSQL
 * const { pool } = createPostgresConnection()
 *
 * // MySQL
 * const { pool } = createMysqlConnection()
 * ```
 */

import Database from 'better-sqlite3'
import type { Database as SqliteDatabase } from 'better-sqlite3'

import { Pool } from 'pg'
import mysql from 'mysql2/promise'

// =============================================================================
// SQLite Connection
// =============================================================================

/**
 * Options for creating a SQLite connection
 */
export interface SqliteConnectionOptions {
  /** Database file path or ':memory:' for in-memory database (default: ':memory:') */
  readonly path?: string
}

/**
 * SQLite connection result
 */
export interface SqliteConnectionResult {
  /** The raw better-sqlite3 Database instance */
  readonly sqliteDb: SqliteDatabase
  /** The Database instance to pass to createCollections */
  readonly db: SqliteDatabase
}

/**
 * Create a SQLite database connection
 *
 * Supports:
 * - :memory: for in-memory databases
 * - File paths for persistent databases
 * - Environment variable override via DATABASE_PATH
 *
 * @param options - Connection options
 * @returns SQLiteConnectionResult with sqliteDb and db instances
 *
 * @example
 * ```typescript
 * // In-memory database (default)
 * const { sqliteDb, db } = createSqliteConnection()
 *
 * // File-based database
 * const { sqliteDb, db } = createSqliteConnection({ path: './data.db' })
 *
 * // With environment override
 * // DATABASE_PATH=./prod.db npx tsx your-script.ts
 * ```
 */
export function createSqliteConnection(
  options: SqliteConnectionOptions = {}
): SqliteConnectionResult {
  const path = process.env.DATABASE_PATH ?? options.path ?? ':memory:'

  const sqliteDb = new Database(path)
  const db = sqliteDb

  return { sqliteDb, db }
}

// =============================================================================
// PostgreSQL Connection
// =============================================================================

/**
 * Options for creating a PostgreSQL connection
 */
export interface PostgresConnectionOptions {
  /** PostgreSQL host (default: 'localhost') */
  readonly host?: string
  /** PostgreSQL port (default: 5432) */
  readonly port?: number
  /** PostgreSQL user (default: 'postgres') */
  readonly user?: string
  /** PostgreSQL password (default: 'postgres') */
  readonly password?: string
  /** PostgreSQL database (default: 'postgres') */
  readonly database?: string
  /** Connection string (alternative to individual options) */
  readonly connectionString?: string
  /** Maximum pool size (default: 10) */
  readonly max?: number
}

/**
 * PostgreSQL connection result
 */
export interface PostgresConnectionResult {
  /** The raw pg Pool instance (for cleanup) */
  readonly pool: Pool
  /** The Pool instance to pass to createCollections */
  readonly db: Pool
}

/**
 * Create a PostgreSQL database connection pool
 *
 * Supports:
 * - Individual connection options (host, port, user, password, database)
 * - Full connection string via connectionString option
 * - Environment variables: POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_URL
 *
 * @param options - Connection options
 * @returns PostgresConnectionResult with pool and db instances
 *
 * @example
 * ```typescript
 * // Default connection (localhost:5432/postgres)
 * const { pool, db } = createPostgresConnection()
 *
 * // With individual options
 * const { pool, db } = createPostgresConnection({
 *   host: 'localhost',
 *   port: 5432,
 *   user: 'myuser',
 *   password: 'mypassword',
 *   database: 'mydb',
 * })
 *
 * // With connection string
 * const { pool, db } = createPostgresConnection({
 *   connectionString: 'postgresql://myuser:mypassword@localhost:5432/mydb',
 * })
 *
 * // Environment variables
 * // POSTGRES_URL=postgresql://myuser:mypassword@localhost:5432/mydb npx tsx your-script.ts
 * ```
 */
export function createPostgresConnection(
  options: PostgresConnectionOptions = {}
): PostgresConnectionResult {
  // Check for connection string first (can include all options)
  const connectionString =
    process.env.POSTGRES_URL ?? options.connectionString

  let poolConfig: ConstructorParameters<typeof Pool>[0]

  if (connectionString) {
    // Use connection string directly
    poolConfig = { connectionString }
  } else {
    // Use individual options with environment variable overrides
    poolConfig = {
      host: process.env.POSTGRES_HOST ?? options.host ?? 'localhost',
      port: parseInt(process.env.POSTGRES_PORT ?? String(options.port ?? '5432'), 10),
      user: process.env.POSTGRES_USER ?? options.user ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD ?? options.password ?? 'postgres',
      database: process.env.POSTGRES_DB ?? options.database ?? 'postgres',
    }
  }

  const pool = new Pool({
    ...poolConfig,
    max: options.max ?? 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

  const db = pool

  return { pool, db }
}

// =============================================================================
// MySQL Connection
// =============================================================================

/**
 * Options for creating a MySQL connection
 */
export interface MysqlConnectionOptions {
  /** MySQL host (default: 'localhost') */
  readonly host?: string
  /** MySQL port (default: 3306) */
  readonly port?: number
  /** MySQL user (default: 'root') */
  readonly user?: string
  /** MySQL password (default: '') */
  readonly password?: string
  /** MySQL database (default: 'test') */
  readonly database?: string
  /** Connection string (alternative to individual options) */
  readonly connectionString?: string
  /** Maximum pool size (default: 10) */
  readonly max?: number
}

/**
 * MySQL connection result
 */
export interface MysqlConnectionResult {
  /** The raw mysql2 PromisePool instance (for cleanup) */
  readonly pool: mysql.Pool
  /** The Pool instance to pass to createCollections */
  readonly db: mysql.Pool
}

/**
 * Create a MySQL database connection pool
 *
 * Supports:
 * - Individual connection options (host, port, user, password, database)
 * - Full connection string via connectionString option
 * - Environment variables: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_URL
 *
 * @param options - Connection options
 * @returns MysqlConnectionResult with pool and db instances
 *
 * @example
 * ```typescript
 * // Default connection (localhost:3306/test)
 * const { pool, db } = createMysqlConnection()
 *
 * // With individual options
 * const { pool, db } = createMysqlConnection({
 *   host: 'localhost',
 *   port: 3306,
 *   user: 'root',
 *   password: 'mypassword',
 *   database: 'mydb',
 * })
 *
 * // With connection string
 * const { pool, db } = createMysqlConnection({
 *   connectionString: 'mysql://root:mypassword@localhost:3306/mydb',
 * })
 *
 * // Environment variables
 * // MYSQL_URL=mysql://root:mypassword@localhost:3306/mydb npx tsx your-script.ts
 * ```
 */
export function createMysqlConnection(
  options: MysqlConnectionOptions = {}
): MysqlConnectionResult {
  // Check for connection string first
  const connectionString =
    process.env.MYSQL_URL ?? options.connectionString

  let poolConfig: {
    host?: string
    port?: number
    user?: string
    password?: string
    database?: string
  }

  if (connectionString) {
    // Parse connection string URL
    const url = new URL(connectionString)
    poolConfig = {
      host: url.hostname || 'localhost',
      port: parseInt(url.port || '3306', 10),
      user: url.username || 'root',
      password: url.password || '',
      database: url.pathname.slice(1) || 'test',
    }
  } else {
    // Use individual options with environment variable overrides
    poolConfig = {
      host: process.env.MYSQL_HOST ?? options.host ?? 'localhost',
      port: parseInt(process.env.MYSQL_PORT ?? String(options.port ?? '3306'), 10),
      user: process.env.MYSQL_USER ?? options.user ?? 'root',
      password: process.env.MYSQL_PASSWORD ?? options.password ?? '',
      database: process.env.MYSQL_DATABASE ?? options.database ?? 'test',
    }
  }

  const pool = mysql.createPool({
    ...poolConfig,
    waitForConnections: true,
    connectionLimit: options.max ?? 10,
    queueLimit: 0,
  })

  const db = pool

  return { pool, db }
}

// =============================================================================
// Connection String Helpers (for manual createCollections usage)
// =============================================================================

/**
 * Build a PostgreSQL connection string from options
 */
export function buildPostgresConnectionString(options: {
  readonly host?: string
  readonly port?: number
  readonly user?: string
  readonly password?: string
  readonly database?: string
}): string {
  const host = options.host ?? 'localhost'
  const port = options.port ?? 5432
  const user = options.user ?? 'postgres'
  const password = options.password ?? 'postgres'
  const database = options.database ?? 'postgres'

  return `postgresql://${user}:${password}@${host}:${port}/${database}`
}

/**
 * Build a MySQL connection string from options
 */
export function buildMysqlConnectionString(options: {
  readonly host?: string
  readonly port?: number
  readonly user?: string
  readonly password?: string
  readonly database?: string
}): string {
  const host = options.host ?? 'localhost'
  const port = options.port ?? 3306
  const user = options.user ?? 'root'
  const password = options.password ?? ''
  const database = options.database ?? 'test'

  return `mysql://${user}:${password}@${host}:${port}/${database}`
}

// =============================================================================
// Cleanup Helper
// =============================================================================

/**
 * Close a database connection
 *
 * Supports:
 * - SQLite: calls .close() on better-sqlite3 Database
 * - PostgreSQL: calls .end() on pg Pool
 * - MySQL: calls .end() on mysql2 Pool
 *
 * @param db - The database connection to close
 *
 * @example
 * ```typescript
 * const { pool, db } = createPostgresConnection()
 *
 * try {
 *   // ... use db
 * } finally {
 *   await closeConnection(db)
 * }
 * ```
 */
export async function closeConnection(
  db: SqliteDatabase | Pool | mysql.Pool
): Promise<void> {
  if (db instanceof Database) {
    db.close()
  } else if ('end' in db && typeof db.end === 'function') {
    await (db as Pool | mysql.Pool).end()
  }
}
