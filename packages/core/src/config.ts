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
export type ConfigOptions = {
  database: DatabaseConfig
  collections: Collection[]
  plugins?: Plugin[]
}

/**
 * Define config return type
 */
export type DefineConfigReturn = {
  collections: Record<string, CollectionWithOperations>
  db: unknown
  $meta: {
    collections: string[]
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

export const defineConfig = (options: ConfigOptions): DefineConfigReturn => {
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
    collections: collectionsMap,
    db: null, // Would be the actual DB connection in real implementation
    $meta: {
      collections: collectionNames,
      plugins: pluginNames
    }
  }
}
