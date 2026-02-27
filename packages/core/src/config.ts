import { Pool, type Pool as PoolType } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'

import type { Collection } from './collection'
import type { CollectionOperations } from './operations'
import type { DatabaseAdapter } from './adapter'
import { buildSchema } from './schema'

/**
 * Collection with operations
 */
export type CollectionWithOperations = Collection & CollectionOperations

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
}

/**
 * Define config return type with inferred collection keys
 */
export type DefineConfigReturn<T extends Collection[] = []> = {
  collections: {
    [K in T[number] as K['slug']]: CollectionWithOperations
  }
  db: ReturnType<typeof drizzle<Record<string, unknown>>>
  $meta: {
    collections: T[number]['slug'][]
    plugins: string[]
  }
}

/**
 * Creates the configuration for the data layer
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
 */
import { createCollectionOperations } from './operations'

export const defineConfig = <T extends Collection[]>(
  options: ConfigOptions<T>
): DefineConfigReturn<T> => {
  // Initialize the database connection based on adapter type
  let pool: PoolType | null = null
  let dbInstance: ReturnType<typeof drizzle<Record<string, unknown>>> | null = null

  let schema: Record<string, unknown> = {}

  if (options.database.type === 'postgres') {
    // Create pool from adapter config
    pool = new Pool({
      connectionString: options.database.config.url
    })

    // Build schema from collections
    schema = buildSchema(options.collections as Collection[])

    // Create Drizzle instance with schema
    dbInstance = drizzle(pool, { schema })
  }

  // Build collections map
  const collectionsMap: Record<string, CollectionWithOperations> = {}
  const collectionNames: string[] = []

  for (const coll of options.collections) {
    const table = schema[coll.slug]
    const collectionWithOps: CollectionWithOperations = {
      ...coll,
      ...createCollectionOperations(coll, coll.slug, dbInstance!, table)
    }
    collectionsMap[coll.slug] = collectionWithOps
    collectionNames.push(coll.slug)
  }

  // Build plugins map
  const pluginNames: string[] = []
  if (options.plugins) {
    for (const plugin of options.plugins) {
      pluginNames.push(plugin.name)

      // Register plugin collections
      if (plugin.collections) {
        for (const [name, coll] of Object.entries(plugin.collections)) {
          const table = schema[name]
          const collectionWithOps: CollectionWithOperations = {
            ...coll,
            ...createCollectionOperations(coll, name, dbInstance!, table)
          }
          collectionsMap[name] = collectionWithOps
          collectionNames.push(name)
        }
      }
    }
  }

  return {
    collections: collectionsMap as DefineConfigReturn<T>['collections'],
    db: dbInstance as DefineConfigReturn<T>['db'],
    $meta: {
      collections: collectionNames as DefineConfigReturn<T>['$meta']['collections'],
      plugins: pluginNames
    }
  }
}
