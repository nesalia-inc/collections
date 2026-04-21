import type { Collection } from '../collections'

/**
 * DbConnectionInput - Database connection configuration
 * Used in defineCollections to specify the database connection
 */
export interface DbConnectionInput {
  /** Database type */
  readonly type: 'postgres' | 'sqlite' | 'mysql'
  /** Database connection - either a Drizzle database instance or a connection string */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly connection: any
  /** Connection string (for postgres) */
  readonly connectionString?: string
  /** Connection options (e.g., for PostgreSQL: max, idleTimeoutMillis) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly options?: any
}

/**
 * MigrationsConfig - Migrations configuration for CLI support
 */
export interface MigrationsConfig {
  /** Migration files directory. Default: './drizzle' */
  readonly dir?: string
  /** Migration table name. Default: '__collections_migrations' */
  readonly table?: string
}

/**
 * ConfigInput - Configuration input for defineCollections
 */
export interface ConfigInput<T extends Collection[]> {
  /** Database connection configuration */
  readonly db: DbConnectionInput
  /** Collection definitions */
  readonly collections: T
  /** Optional migrations configuration */
  readonly migrations?: MigrationsConfig
}

type CollectionsRecord<T extends Collection[]> = {
  [K in T[number] as K extends Collection<infer S> ? S : never]: K
}

/**
 * Resolved migrations config with defaults applied
 */
export type ResolvedMigrationsConfig = {
  /** Migration files directory */
  readonly dir: string
  /** Migration table name */
  readonly table: string
}

export type Config<T extends Collection[]> = {
  readonly collections: CollectionsRecord<T>
  /** Database connection configuration (same as DbConnectionInput) */
  readonly db: DbConnectionInput
  readonly migrations: ResolvedMigrationsConfig
}
