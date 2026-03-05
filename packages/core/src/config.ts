import { Pool, type Pool as PoolType } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'

import type { Collection } from './collection'
import type { DatabaseAdapter } from './adapter'
import { buildSchema } from './schema'
import { DbWrapper, type OperationResult } from './operations/db-wrapper'

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
 * Database wrapper type with collection methods
 */
export type DbWithCollections<T extends Collection[]> = {
  [K in T[number] as K['slug']]: {
    find: (options?: {
      where?: Record<string, unknown>
      orderBy?: Record<string, unknown> | Record<string, unknown>[]
      limit?: number
      offset?: number
    }) => Promise<OperationResult<any[]>>

    findById: (id: number) => Promise<OperationResult<any | undefined>>

    findFirst: (options: {
      where: Record<string, unknown>
      orderBy?: Record<string, unknown> | Record<string, unknown>[]
    }) => Promise<OperationResult<any | undefined>>

    count: (options?: { where?: Record<string, unknown> }) => Promise<OperationResult<number>>

    exists: (options: { where: Record<string, unknown> }) => Promise<OperationResult<boolean>>

    create: (options: { data: Record<string, unknown>; returning?: boolean }) => Promise<OperationResult<any | undefined>>

    createMany: (options: { data: Record<string, unknown>[] }) => Promise<OperationResult<number>>

    update: (options: {
      where: Record<string, unknown>
      data: Record<string, unknown>
      returning?: boolean
    }) => Promise<OperationResult<any | undefined>>

    updateMany: (options: {
      where: Record<string, unknown>
      data: Record<string, unknown>
    }) => Promise<OperationResult<number>>

    delete: (options: { where: Record<string, unknown>; returning?: boolean }) => Promise<OperationResult<any | undefined>>

    deleteMany: (options: { where: Record<string, unknown> }) => Promise<OperationResult<number>>
  }
} & {
  /**
   * Get raw Drizzle instance for advanced queries
   */
  $raw: ReturnType<typeof drizzle<Record<string, unknown>>>
}

/**
 * Define config return type with inferred collection keys
 *
 * - collections: metadata only (slug, name, fields, hooks, dataType)
 * - db: High-level API with collection methods + cache keys
 * - $meta: array of collection slugs and plugin names
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

/**
 * Get table from schema by slug
 */
function getTableFromSchema(schema: Record<string, unknown>, slug: string): Record<string, unknown> | undefined {
  const table = schema[slug]
  if (table && typeof table === 'object' && table !== null) {
    return table as Record<string, unknown>
  }
  return undefined
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

  // Create DB wrapper
  const dbWrapper = new DbWrapper()

  // Register each collection
  if (dbInstance) {
    for (const coll of options.collections) {
      const table = getTableFromSchema(schema, coll.slug)
      if (table) {
        dbWrapper.register(coll.slug, coll, dbInstance, table)
      }
    }
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

          // Also register in DB wrapper
          const table = getTableFromSchema(schema, coll.slug)
          if (table && dbInstance) {
            dbWrapper.register(name, coll, dbInstance, table)
          }
        }
      }
    }
  }

  // Create the db object with collection methods
  const db: Record<string, unknown> = {}

  for (const slug of collectionNames) {
    const wrapper = dbWrapper.get(slug)
    if (wrapper) {
      // Add all methods to the db object
      db[slug] = {
        find: (opts: any) => wrapper.find(opts),
        findById: (id: number) => wrapper.findById(id),
        findFirst: (opts: any) => wrapper.findFirst(opts),
        count: (opts: any) => wrapper.count(opts),
        exists: (opts: any) => wrapper.exists(opts),
        create: (opts: any) => wrapper.create(opts),
        createMany: (opts: any) => wrapper.createMany(opts),
        update: (opts: any) => wrapper.update(opts),
        updateMany: (opts: any) => wrapper.updateMany(opts),
        delete: (opts: any) => wrapper.delete(opts),
        deleteMany: (opts: any) => wrapper.deleteMany(opts)
      }
    }
  }

  // Add raw drizzle instance
  ;(db as any).$raw = dbInstance

  return {
    collections: collectionsMap as DefineConfigReturn<T>['collections'],
    db: db as DefineConfigReturn<T>['db'],
    $meta: {
      collections: collectionNames as DefineConfigReturn<T>['$meta']['collections'],
      plugins: pluginNames
    }
  }
}
