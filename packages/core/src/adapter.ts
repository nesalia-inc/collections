/**
 * PostgreSQL adapter configuration
 */
export type PgAdapterConfig = {
  url: string
  migrationsPath?: string
}

/**
 * PostgreSQL adapter
 */
export interface PgAdapter {
  type: 'postgres'
  config: PgAdapterConfig
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
 */
export const pgAdapter = (config: PgAdapterConfig): PgAdapter => {
  return {
    type: 'postgres',
    config: {
      url: config.url,
      migrationsPath: config.migrationsPath ?? './migrations'
    }
  }
}
