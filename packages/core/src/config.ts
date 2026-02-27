import type { Collection } from './collection'
import type { CollectionOperations } from './operations'

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
 * Database configuration
 */
export type DatabaseConfig = {
  url: string
}

/**
 * Configuration options
 */
export type ConfigOptions<T extends Collection[] = []> = {
  database: DatabaseConfig
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
  db: unknown
  $meta: {
    collections: T[number]['slug'][]
    plugins: string[]
  }
}

/**
 * Creates the configuration for the data layer
 *
 * @example
 * export const { collections, db } = defineConfig({
 *   database: {
 *     url: process.env.DATABASE_URL!
 *   },
 *   collections: [users, posts],
 *   plugins: [timestampsPlugin()]
 * })
 */
import { createCollectionOperations } from './operations'

export const defineConfig = <T extends Collection[]>(
  options: ConfigOptions<T>
): DefineConfigReturn<T> => {
  // Build collections map
  const collectionsMap: Record<string, CollectionWithOperations> = {}
  const collectionNames: string[] = []

  for (const coll of options.collections) {
    const collectionWithOps: CollectionWithOperations = {
      ...coll,
      ...createCollectionOperations(coll, coll.slug)
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
          const collectionWithOps: CollectionWithOperations = {
            ...coll,
            ...createCollectionOperations(coll, name)
          }
          collectionsMap[name] = collectionWithOps
          collectionNames.push(name)
        }
      }
    }
  }

  return {
    collections: collectionsMap as DefineConfigReturn<T>['collections'],
    db: null,
    $meta: {
      collections: collectionNames as DefineConfigReturn<T>['$meta']['collections'],
      plugins: pluginNames
    }
  }
}
