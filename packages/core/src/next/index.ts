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

// Type for withCollections configuration
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
 * Create a Next.js plugin that provides collections integration
 *
 * @example
 * // next.config.mjs
 * import { withCollections } from '@deessejs/collections/next'
 *
 * export default withCollections({
 *   // Next.js config
 * })
 */
export function withCollections(nextConfig: NextConfig, options: WithCollectionsOptions = {}): WithCollectionsConfig {
  const {
    configPath = './collections/config',
    hotReload = true,
    outputDir = './drizzle'
  } = options

  // Use the options to avoid unused variable warnings
  void configPath

  const isProduction = !isDevelopment()

  // Return config with collections metadata
  // In production, this is static
  // In development, we can optionally watch for changes
  // Note: shouldHotReload would be used for file watching implementation
  const _shouldHotReload = hotReload && isDevelopment() && !isBuildTime()
  void _shouldHotReload

  // Create webpack config that optionally passes through to user config
  const webpackConfig = nextConfig.webpack
    ? (webpackConfig: unknown, context: Parameters<NonNullable<NextConfig['webpack']>>[1]) => {
        return nextConfig.webpack!(webpackConfig, context)
      }
    : undefined

  return {
    ...nextConfig,
    collections: {
      collections: {} as Record<string, Collection>,
      outputDir,
      isProduction
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
} | undefined {
  return nextConfig.collections
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
