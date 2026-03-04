/**
 * PostgreSQL adapter configuration
 */
export type PgAdapterConfig = {
  url: string
  migrationsPath?: string
}

/**
 * PostgreSQL adapter
 *
 * @example
 * const adapter = pgAdapter({
 *   url: 'postgres://user:pass@localhost:5432/db'
 * })
 *
 * // Get pool for drizzle
 * const pool = adapter.getPool()
 */
export interface PgAdapter {
  type: 'postgres'
  config: PgAdapterConfig
  /** Get the underlying connection pool */
  getPool: () => Promise<import('pg').Pool>
}

/**
 * Database adapter type
 */
export type DatabaseAdapter = PgAdapter

/**
 * Creates a PostgreSQL adapter
 *
 * @example
 * const adapter = pgAdapter({
 *   url: 'postgres://user:pass@localhost:5432/db'
 * })
 *
 * // Get pool for drizzle
 * const pool = await adapter.getPool()
 */
export const pgAdapter = (config: PgAdapterConfig): PgAdapter => {
  let pool: import('pg').Pool | null = null

  return {
    type: 'postgres',
    config: {
      url: config.url,
      migrationsPath: config.migrationsPath ?? './migrations'
    },
    getPool: async () => {
      if (!pool) {
        const { Pool } = await import('pg')
        pool = new Pool({
          connectionString: config.url
        })
      }
      return pool
    }
  }
}
