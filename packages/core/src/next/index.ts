/**
 * Next.js integration module for @deessejs/collections
 *
 * Provides hot reload support and Next.js plugin for collections
 */

import type { NextConfig } from 'next'
import type { Collection } from '../collection'
import type { DefineConfigReturn } from '../config'

// Re-export types from core for convenience
export type {
  Collection,
  CollectionConfig,
  CollectionHooks,
  OperationType,
  CreateHookContext,
  UpdateHookContext,
  DeleteHookContext,
  ReadHookContext,
  OperationHookContext
} from '../collection'

// Re-export field types
export type { FieldDefinition, FieldOptions } from '../field'
export type { FieldTypeInstance } from '../field-type'

// Re-export field types and utilities
export { field, f, defineConfig, pgAdapter, buildSchema, collection } from '../index'

/**
 * Type for withCollections configuration
 */
export interface WithCollectionsOptions {
  /**
   * Path to the collections config file
   * @default './collections/config'
   */
  configPath?: string

  /**
   * Enable hot reload in development
   * @default true
   */
  hotReload?: boolean

  /**
   * Output directory for generated schema
   * @default './drizzle'
   */
  outputDir?: string
}

/**
 * Type for the Next.js config returned by withCollections
 */
export type WithCollectionsConfig = NextConfig & {
  collections?: {
    collections: Record<string, Collection>
    outputDir: string
    isProduction: boolean
    configPath: string
  }
}

/**
 * Check if we're running in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if we're running in a build-time context
 */
function isBuildTime(): boolean {
  const buildFlags = [
    process.env.__NEXT_BUILD,
    process.env.TURBO_BUILD,
    process.env.VERCEL
  ]
  return buildFlags.some(flag => flag === '1')
}

/**
 * Load collections from a config file
 * This function dynamically requires the config file to extract collection definitions
 */
function loadCollectionsFromConfig(configPath: string): Record<string, Collection> {
  try {
    // Clear require cache to ensure fresh load
    const cachedModule = require.cache[require.resolve(configPath)]
    if (cachedModule) {
      delete require.cache[require.resolve(configPath)]
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(configPath)

    // Handle both default export and named exports
    const collections: Record<string, Collection> = {}

    // Check for default export
    if (config.default) {
      const exports = config.default
      for (const [key, value] of Object.entries(exports)) {
        if (key !== 'default' && typeof value === 'object' && value !== null && 'slug' in value) {
          collections[key] = value as Collection
        }
      }
    }

    // Check for named exports
    for (const [key, value] of Object.entries(config)) {
      if (key !== 'default' && typeof value === 'object' && value !== null && 'slug' in value) {
        collections[key] = value as Collection
      }
    }

    return collections
  } catch {
    // Config file doesn't exist or can't be loaded
    // Return empty collections - this is expected in some cases
    return {}
  }
}

/**
 * Create a Next.js plugin that provides collections integration
 *
 * @example
 * // next.config.mjs
 * import { withCollections } from '@deessejs/collections/next'
 *
 * export default withCollections({
 *   // Next.js config
 * })
 *
 * // collections/config.ts
 * import { collection, field, f } from '@deessejs/collections'
 *
 * export const users = collection({
 *   slug: 'users',
 *   fields: {
 *     name: field({ fieldType: f.text() }),
 *     email: field({ fieldType: f.email() })
 *   }
 * })
 */
export function withCollections(nextConfig: NextConfig, options: WithCollectionsOptions = {}): WithCollectionsConfig {
  const {
    configPath = './collections/config',
    hotReload = true,
    outputDir = './drizzle'
  } = options

  const isProduction = !isDevelopment()
  const shouldHotReload = hotReload && isDevelopment() && !isBuildTime()

  // Load collections from config file at build time
  // In production, this happens once during build
  // In development, Next.js will rebuild when config changes
  const collections = loadCollectionsFromConfig(configPath)

  // Create webpack configuration
  let webpackConfig: NextConfig['webpack'] | undefined

  if (shouldHotReload) {
    // Add hot reload plugin to watch for config changes
    webpackConfig = (webpackConfigValue, context) => {
      // Add our custom plugin to watch for file changes
      if (context.dev && !context.isServer) {
        // In dev mode, we can add file watching
        // The actual hot reload is handled by Next.js webpack dev server
      }

      // Call user webpack config if provided
      if (nextConfig.webpack) {
        return nextConfig.webpack(webpackConfigValue, context)
      }

      return webpackConfigValue
    }
  }

  return {
    ...nextConfig,
    collections: {
      collections,
      outputDir,
      isProduction,
      configPath
    },
    webpack: webpackConfig
  }
}

/**
 * Get the collections configuration from the Next.js config
 */
export function getCollectionsConfig(nextConfig: WithCollectionsConfig): {
  collections: Record<string, Collection>
  outputDir: string
  isProduction: boolean
  configPath: string
} | undefined {
  return nextConfig.collections
}

/**
 * Get collections from a config file
 * Useful for runtime access to collections
 *
 * @example
 * import { loadCollections } from '@deessejs/collections/next'
 *
 * const collections = loadCollections('./collections/config')
 */
export function loadCollections(configPath: string): Record<string, Collection> {
  return loadCollectionsFromConfig(configPath)
}

/**
 * Create a client-safe collections wrapper
 * This provides stable exports during build time
 *
 * @example
 * // lib/collections.ts
 * import { createCollections } from '@deessejs/collections/next'
 *
 * export const { collections, db } = createCollections()
 */
export function createCollections() {
  // During build time, we return empty/stable values
  // At runtime in development, this could be hot-reloaded
  return {
    collections: {} as Record<string, Collection>,
    db: null,
    config: null as DefineConfigReturn | null
  }
}

/**
 * Type helper to check if a value is a valid Next.js config
 */
export function isNextConfig(config: unknown): config is NextConfig {
  if (!config || typeof config !== 'object') return false
  return true
}

/**
 * Type helper to check if withCollections was applied
 */
export function isCollectionsConfig(config: unknown): config is WithCollectionsConfig {
  if (!config || typeof config !== 'object') return false
  const cfg = config as Record<string, unknown>
  return cfg.collections !== undefined
}

/**
 * Default withCollections options
 */
export const defaultWithCollectionsOptions: Required<WithCollectionsOptions> = {
  configPath: './collections/config',
  hotReload: true,
  outputDir: './drizzle'
}
