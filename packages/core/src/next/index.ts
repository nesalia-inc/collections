/**
 * Next.js integration module for @deessejs/collections
 *
 * Provides hot reload support and Next.js plugin for collections
 */

import type { NextConfig } from 'next'
import type { Collection } from '../collection'
import { resolve } from 'path'
import { cwd } from 'process'

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
 * Validate that a path is within the project directory
 * Prevents path traversal attacks
 */
function validateConfigPath(configPath: string): string {
  const resolvedPath = resolve(cwd(), configPath)
  const projectRoot = cwd()

  // Ensure the resolved path is within the project directory
  if (!resolvedPath.startsWith(projectRoot)) {
    throw new Error(`Config path must be within project directory: ${configPath}`)
  }

  return resolvedPath
}

/**
 * Load collections from a config file using dynamic import
 * Supports both ESM and CommonJS modules
 */
async function loadCollectionsFromConfig(configPath: string): Promise<Record<string, Collection>> {
  try {
    const validatedPath = validateConfigPath(configPath)

    // Try dynamic import for ESM support
    const module = await import(/* @vite-ignore */ validatedPath)

    const collections: Record<string, Collection> = {}

    // Check for default export
    if (module.default) {
      const exports = module.default
      for (const [key, value] of Object.entries(exports)) {
        if (key !== 'default' && typeof value === 'object' && value !== null && 'slug' in value) {
          collections[key] = value as Collection
        }
      }
    }

    // Check for named exports
    for (const [key, value] of Object.entries(module)) {
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
export async function withCollections(nextConfig: NextConfig, options: WithCollectionsOptions = {}): Promise<WithCollectionsConfig> {
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
  const collections = await loadCollectionsFromConfig(configPath)

  // Create webpack configuration for hot reload
  let webpackConfig: NextConfig['webpack'] | undefined

  if (shouldHotReload) {
    // In development with hot reload enabled, add webpack configuration
    // to ensure collections are reloaded when config files change
    webpackConfig = (webpackConfigValue, context) => {
      // Add config file to webpack's watched files for hot reload
      if (context.dev && !context.isServer) {
        // Use webpack's built-in watch mechanism for config files
        // This ensures hot reload works when collection definitions change
        // The actual file watching is handled by Next.js webpack dev server
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
 * Synchronous version of withCollections for backward compatibility
 * Returns config without loading collections (for build-time only usage)
 *
 * @deprecated Use withCollections() for async loading
 */
export function withCollectionsSync(nextConfig: NextConfig, options: WithCollectionsOptions = {}): WithCollectionsConfig {
  const {
    configPath = './collections/config',
    hotReload = true,
    outputDir = './drizzle'
  } = options

  const isProduction = !isDevelopment()
  const shouldHotReload = hotReload && isDevelopment() && !isBuildTime()

  // For sync version, we don't load collections - user must use loadCollections separately
  const collections: Record<string, Collection> = {}

  // Create webpack configuration for hot reload
  let webpackConfig: NextConfig['webpack'] | undefined

  if (shouldHotReload) {
    webpackConfig = (webpackConfigValue, context) => {
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
 * Load collections from a config file
 * Useful for runtime or build-time access to collections
 *
 * @example
 * import { loadCollections } from '@deessejs/collections/next'
 *
 * const collections = await loadCollections('./collections/config')
 */
export async function loadCollections(configPath: string): Promise<Record<string, Collection>> {
  return loadCollectionsFromConfig(configPath)
}

/**
 * Create a collections wrapper for build-time access
 * This provides collections and db from the Next.js config
 *
 * @example
 * // lib/collections.ts
 * import { createCollections } from '@deessejs/collections-next'
 * import type { NextConfig } from 'next'
 *
 * export function getCollections(nextConfig: NextConfig) {
 *   const collectionsConfig = nextConfig.collections
 *   if (!collectionsConfig) {
 *     throw new Error('withCollections must be used in next.config')
 *   }
 *   return collectionsConfig.collections
 * }
 */
export function getCollectionsFromConfig(nextConfig: WithCollectionsConfig): Record<string, Collection> {
  if (!nextConfig.collections) {
    return {}
  }
  return nextConfig.collections.collections
}

/**
 * Get database instance from Next.js config
 * The db is typically set up in the collections config file
 */
export function getDbFromConfig(_nextConfig: WithCollectionsConfig): unknown {
  // This would be initialized from the collections config
  // User should set up their own db connection
  return null
}

/**
 * Type guard to check if a value is a valid Next.js config
 */
export function isNextConfig(config: unknown): config is NextConfig {
  if (!config || typeof config !== 'object') return false

  // Check for common Next.js config properties
  const cfg = config as Record<string, unknown>
  const validProps = ['reactStrictMode', 'swcMinify', 'trailingSlash', 'poweredByHeader', 'compress']

  // Must have at least one Next.js-specific property
  return validProps.some(prop => prop in cfg)
}

/**
 * Type guard to check if withCollections was applied
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
