/**
 * Configuration Module - Pure Functions for Building Database Config
 *
 * This module provides clean, composable functions for setting up the database.
 * Each function has a single responsibility.
 */

import { Pool, type Pool as PoolType } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'

import type { Collection } from './collection'
import type { DatabaseAdapter } from './adapter'
import type { ValidationOptions } from './operations/types'
import { buildSchema } from './schema'
import { database, type Database, type CollectionDb } from './operations/db-wrapper'

// ============================================================================
// Types
// ============================================================================

/**
 * Plugin interface
 */
export type Plugin = {
  name: string
  collections?: Record<string, Collection>
  hooks?: Record<string, unknown[]>
}

/**
 * Configuration options
 */
export type ConfigOptions<T extends Collection[] = []> = {
  database: DatabaseAdapter
  collections: T
  plugins?: Plugin[]
  validation?: ValidationOptions
}

/**
 * Database wrapper type with collection methods
 */
export type DbWithCollections<T extends Collection[]> = {
  [K in T[number] as K['slug']]: CollectionDb
} & {
  /**
   * Get raw Drizzle instance for advanced queries
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $raw: any
}

/**
 * Define config return type with inferred collection keys
 */
export type DefineConfigReturn<T extends Collection[] = []> = {
  collections: {
    [K in T[number] as K['slug']]: Collection
  }
  db: DbWithCollections<T>
  $meta: {
    collections: T[number]['slug'][]
    plugins: string[]
  }
}

// ============================================================================
// Pure Functions (Each Has One Responsibility)
// ============================================================================

/**
 * Connect to database based on adapter type
 */
export const connect = (
  adapter: DatabaseAdapter
): { pool: PoolType | null; dbInstance: ReturnType<typeof drizzle> | null } => {
  if (adapter.type !== 'postgres') {
    return { pool: null, dbInstance: null }
  }

  const pool = new Pool({
    connectionString: adapter.config.url
  })

  const dbInstance = drizzle(pool, { schema: {} })

  return { pool, dbInstance }
}

/**
 * Get table from schema by slug
 */
export const getTableFromSchema = (
  schema: Record<string, unknown>,
  slug: string
): Record<string, unknown> | undefined => {
  const table = schema[slug]
  if (table && typeof table === 'object' && table !== null) {
    return table as Record<string, unknown>
  }
  return undefined
}

/**
 * Build schema from collections
 */
export const buildRuntimeSchema = (
  collections: Collection[]
): Record<string, unknown> => {
  return buildSchema(collections)
}

/**
 * Apply plugins to collections (add more collections)
 */
export const applyPlugins = (
  baseCollections: Collection[],
  plugins: Plugin[] | undefined
): Collection[] => {
  if (!plugins) return baseCollections

  const pluginCollections = plugins.flatMap(plugin =>
    plugin.collections ? Object.values(plugin.collections) : []
  )

  return [...baseCollections, ...pluginCollections]
}

/**
 * Extract collection metadata (without operations)
 */
export const toMetadata = (collection: Collection): Collection => ({
  slug: collection.slug,
  name: collection.name,
  fields: collection.fields,
  hooks: collection.hooks,
  dataType: collection.dataType
})

/**
 * Build collections map with metadata
 */
export const buildCollectionsMap = (
  collections: Collection[]
): Record<string, Collection> => {
  return collections.reduce((acc, coll) => {
    acc[coll.slug] = toMetadata(coll)
    return acc
  }, {} as Record<string, Collection>)
}

/**
 * Get plugin names
 */
export const getPluginNames = (plugins: Plugin[] | undefined): string[] => {
  return plugins?.map(p => p.name) ?? []
}

/**
 * Build the final db object from database
 */
export const buildDbObject = (
  db: Database,
  dbInstance: ReturnType<typeof drizzle> | null
): DbWithCollections<Collection[]> => {
  // Add $raw for advanced queries
  const dbWithRaw = db as DbWithCollections<Collection[]>
  dbWithRaw.$raw = dbInstance

  return dbWithRaw
}

// ============================================================================
// Main Entry Point - Composition of Pure Functions
// ============================================================================

/**
 * Creates the configuration for the data layer
 *
 * This function wires everything together - it calls the pure functions
 * in the right order to build the final config.
 *
 * @example
 * const adapter = pgAdapter({
 *   url: process.env.DATABASE_URL!
 * })
 *
 * export const { collections, db } = defineConfig({
 *   database: adapter,
 *   collections: [users, posts],
 *   plugins: [timestampsPlugin()]
 * })
 *
 * // collections: metadata only
 * collections.users.slug     // 'users'
 * collections.users.fields   // { name, email, ... }
 *
 * // db: High-level API with collection methods
 * const result = await db.users.find({ where: { status: 'published' } })
 * // result.data = [...]
 * // result.meta.cacheKeys = ['users:find:status=published']
 *
 * const created = await db.users.create({ data: { name: 'John' } })
 * // created.meta.invalidateKeys = ['users:*']
 */
export const defineConfig = <T extends Collection[]>(
  options: ConfigOptions<T>
): DefineConfigReturn<T> => {
  // Step 1: Build schema from collections
  const schema = buildRuntimeSchema(options.collections as Collection[])

  // Step 2: Connect to database (returns drizzle instance)
  const { pool, dbInstance } = connect(options.database)

  // If we have a db instance, update it with the schema
  if (dbInstance && pool) {
    // Recreate drizzle with the built schema
    Object.assign(dbInstance, drizzle(pool, { schema }))
  }

  // Step 3: Apply plugins to get all collections
  const allCollections = applyPlugins(options.collections, options.plugins)

  // Step 4: Build database with all collections
  const db = database({
    collections: allCollections,
    db: dbInstance,
    schema,
    validation: options.validation
  })

  // Step 5: Build collections metadata (without operations)
  const collectionsMap = buildCollectionsMap(allCollections)

  // Step 6: Get plugin names
  const pluginNames = getPluginNames(options.plugins)

  // Step 7: Build final db object with $raw
  const dbObject = buildDbObject(db, dbInstance)

  return {
    collections: collectionsMap as DefineConfigReturn<T>['collections'],
    db: dbObject as DefineConfigReturn<T>['db'],
    $meta: {
      collections: allCollections.map(c => c.slug) as DefineConfigReturn<T>['$meta']['collections'],
      plugins: pluginNames
    }
  }
}
