/**
 * Next.js integration module for @deessejs/collections
 *
 * Provides hot reload support and Next.js plugin for collections
 */

import type { NextConfig } from 'next'
import type { Collection } from '../collection'
import { resolve } from 'path'
import process from 'process'

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

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean
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
  return process.env.__NEXT_BUILD === '1' || process.env.TURBO_BUILD === '1' || process.env.VERCEL === '1'
}

/**
 * Debug logging function
 */
function debugLog(enabled: boolean, ...args: unknown[]): void {
  if (enabled) console.debug('[collections/next]', ...args)
}

/**
 * Validate that a path is within the project directory
 */
function validateConfigPath(configPath: string, debug: boolean): string {
  const projectRoot = process.cwd()
  const resolvedPath = resolve(projectRoot, configPath)
  const normalizedPath = resolvedPath.replace(/\\/g, '/')
  const normalizedRoot = projectRoot.replace(/\\/g, '/')

  if (!normalizedPath.startsWith(normalizedRoot + '/') && normalizedPath !== normalizedRoot) {
    throw new Error(`Config path must be within project directory: ${configPath}`)
  }

  debugLog(debug, 'Validated config path:', resolvedPath)
  return resolvedPath
}

/**
 * Extract collections from a loaded module
 */
function extractCollectionsFromModule(module: Record<string, unknown>): Record<string, Collection> {
  const collections: Record<string, Collection> = {}
  const defaultExport = module.default as Record<string, unknown> | undefined
  const defaultCollections = defaultExport ? extractFromObject(defaultExport) : {}
  const namedCollections = extractFromObject(module)

  return { ...defaultCollections, ...namedCollections }
}

function extractFromObject(obj: Record<string, unknown>): Record<string, Collection> {
  const collections: Record<string, Collection> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key !== 'default' && typeof value === 'object' && value !== null && 'slug' in value) {
      collections[key] = value as Collection
    }
  }
  return collections
}

/**
 * Load collections from a config file using dynamic import
 */
async function loadCollectionsFromConfig(configPath: string, debug: boolean): Promise<Record<string, Collection>> {
  try {
    const validatedPath = validateConfigPath(configPath, debug)
    const module = await import(/* @vite-ignore */ validatedPath)
    const collections = extractCollectionsFromModule(module as Record<string, unknown>)
    debugLog(debug, `Loaded ${Object.keys(collections).length} collections`)
    return collections
  } catch {
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
 */
export async function withCollections(nextConfig: NextConfig, options: WithCollectionsOptions = {}): Promise<WithCollectionsConfig> {
  const { configPath = './collections/config', hotReload = true, outputDir = './drizzle', debug = false } = options
  const isProduction = !isDevelopment()
  const shouldHotReload = hotReload && isDevelopment() && !isBuildTime()

  const collections = await loadCollectionsFromConfig(configPath, debug)
  let webpackConfig: NextConfig['webpack']

  if (shouldHotReload && nextConfig.webpack) {
    webpackConfig = (cfg, ctx) => nextConfig.webpack!(cfg, ctx)
  }

  return { ...nextConfig, collections: { collections, outputDir, isProduction, configPath }, webpack: webpackConfig }
}

/**
 * Synchronous version of withCollections
 * @deprecated Use withCollections() instead
 */
export function withCollectionsSync(nextConfig: NextConfig, options: WithCollectionsOptions = {}): WithCollectionsConfig {
  const { configPath = './collections/config', hotReload = true, outputDir = './drizzle' } = options
  const isProduction = !isDevelopment()
  const shouldHotReload = hotReload && isDevelopment() && !isBuildTime()
  let webpackConfig: NextConfig['webpack']

  if (shouldHotReload && nextConfig.webpack) {
    webpackConfig = (cfg, ctx) => nextConfig.webpack!(cfg, ctx)
  }

  return { ...nextConfig, collections: { collections: {}, outputDir, isProduction, configPath }, webpack: webpackConfig }
}

/**
 * Get the collections configuration from the Next.js config
 */
export function getCollectionsConfig(nextConfig: WithCollectionsConfig) {
  return nextConfig.collections
}

/**
 * Load collections from a config file
 */
export async function loadCollections(configPath: string): Promise<Record<string, Collection>> {
  return loadCollectionsFromConfig(configPath, false)
}

/**
 * Extract collections from Next.js config
 */
export function getCollectionsFromConfig(nextConfig: WithCollectionsConfig): Record<string, Collection> {
  return nextConfig.collections?.collections ?? {}
}

/**
 * Type guard to check if a value is a valid Next.js config
 */
export function isNextConfig(config: unknown): config is NextConfig {
  if (!config || typeof config !== 'object') return false
  const cfg = config as Record<string, unknown>
  if ('reactStrictMode' in cfg && typeof cfg.reactStrictMode !== 'boolean') return false
  if ('swcMinify' in cfg && typeof cfg.swcMinify !== 'boolean') return false
  const validProps = ['reactStrictMode', 'swcMinify', 'trailingSlash', 'poweredByHeader', 'compress']
  return validProps.some(prop => prop in cfg)
}

/**
 * Type guard to check if withCollections was applied
 */
export function isCollectionsConfig(config: unknown): config is WithCollectionsConfig {
  if (!config || typeof config !== 'object') return false
  return (config as Record<string, unknown>).collections !== undefined
}

/**
 * Default withCollections options
 */
export const defaultWithCollectionsOptions: Required<WithCollectionsOptions> = {
  configPath: './collections/config',
  hotReload: true,
  outputDir: './drizzle',
  debug: false
}
