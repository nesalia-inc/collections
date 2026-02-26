import type { Collection } from './collection'

/**
 * Plugin interface
 */
export interface Plugin {
  name: string
  collections?: Record<string, Collection>
  hooks?: Record<string, unknown[]>
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  url: string
}

/**
 * Configuration options
 */
export interface ConfigOptions {
  database: DatabaseConfig
  collections: Collection[]
  plugins?: Plugin[]
}

/**
 * Define config return type
 */
export interface DefineConfigReturn {
  collections: Record<string, unknown>
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
export function defineConfig(options: ConfigOptions): DefineConfigReturn {
  // Build collections map
  const collectionsMap: Record<string, unknown> = {}
  const collectionNames: string[] = []

  for (const coll of options.collections) {
    collectionsMap[coll.slug] = coll
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
          collectionsMap[name] = coll
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
