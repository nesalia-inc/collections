import { Pool, type Pool as PoolType } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'

import type { Collection } from './collection'
import type { DatabaseAdapter } from './adapter'
import { buildSchema } from './schema'

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
 *
 * - collections: metadata only (slug, name, fields, hooks, dataType)
 * - db: Drizzle instance with operations (via schema tables)
 * - $meta: array of collection slugs and plugin names
 */
export type DefineConfigReturn<T extends Collection[] = []> = {
  collections: {
    [K in T[number] as K['slug']]: Collection
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
 *
 * // collections: metadata only
 * collections.users.slug     // 'users'
 * collections.users.fields   // { name, email, ... }
 *
 * // db: Drizzle instance with operations
 * await db.users.findMany()
 * await db.users.insert(values)
 */
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

  // Build collections map (metadata only)
  const collectionsMap: Record<string, Collection> = {}
  const collectionNames: string[] = []

  for (const coll of options.collections) {
    // Store only metadata (not operations)
    collectionsMap[coll.slug] = {
      slug: coll.slug,
      name: coll.name,
      fields: coll.fields,
      hooks: coll.hooks,
      dataType: coll.dataType
    }
    collectionNames.push(coll.slug)
  }

  // Build plugins map
  const pluginNames: string[] = []
  if (options.plugins) {
    for (const plugin of options.plugins) {
      pluginNames.push(plugin.name)

      // Register plugin collections (metadata only)
      if (plugin.collections) {
        for (const [name, coll] of Object.entries(plugin.collections)) {
          collectionsMap[name] = {
            slug: coll.slug,
            name: coll.name,
            fields: coll.fields,
            hooks: coll.hooks,
            dataType: coll.dataType
          }
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
