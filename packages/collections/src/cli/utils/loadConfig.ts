/**
 * Load Config
 *
 * Dynamically loads the collection.config.ts file and returns the resolved config.
 */

import { err, ok, error, attemptAsync, type Result } from '@deessejs/core'
import { z } from 'zod'
import type { Collection } from '../../collections'

// ============================================================================
// Types
// ============================================================================

/**
 * Database connection configuration for CLI
 */
export interface CliDbConfig {
  /** Database type */
  readonly type: 'postgres' | 'sqlite'
  /** Connection string */
  readonly connectionString?: string
}

/**
 * Loaded configuration from collection.config.ts
 */
export interface LoadedConfig {
  /** Collection definitions mapped by slug */
  readonly collections: Record<string, Collection>
  /** Database configuration */
  readonly db: CliDbConfig
  /** Migrations configuration */
  readonly migrations?: {
    readonly dir?: string
    readonly table?: string
  }
}

// ============================================================================
// Error Types
// ============================================================================

const ConfigLoadError = error({
  name: 'ConfigLoadError',
  schema: z.object({
    path: z.string(),
    cause: z.string(),
  }),
  message: (args) => `Failed to load config from ${args.path}: ${args.cause}`,
})

export type ConfigLoadErrorType = ReturnType<typeof ConfigLoadError>

// ============================================================================
// Config Loading
// ============================================================================

/**
 * Load collection config from a file path
 *
 * @param configPath - Path to the collection.config.ts file
 * @returns Result containing the loaded config or an error
 */
export const loadConfig = async (
  configPath: string
): Promise<Result<LoadedConfig, ConfigLoadErrorType>> => {
  // Use dynamic import to load the config file
  // This allows users to use TypeScript in their config files
  const loadResult = await attemptAsync(async () => {
    const pathModule = await import('node:path')
    const { exec } = await import('node:child_process')
    const { promisify } = await import('node:util')
    const execAsync = promisify(exec)

    // Handle both relative and absolute paths
    let absolutePath: string
    if (configPath.startsWith('/') || configPath.match(/^[a-zA-Z]:/)) {
      absolutePath = configPath
    } else {
      // Relative path - resolve from current working directory
      const cwd = process.cwd()
      absolutePath = pathModule.resolve(cwd, configPath)
    }

    // For dynamic imports of TypeScript files, we use tsx to evaluate the config
    // On Windows, absolute paths need to be file:// URLs
    const pathForImport = absolutePath.match(/^[a-zA-Z]:/) ? `file:///${absolutePath.replace(/\\/g, '/')}` : absolutePath.replace(/\\/g, '/')
    const command = `npx tsx --eval "import('${pathForImport}').then(m => console.log(JSON.stringify(m.default)))"`

    const { stdout } = await execAsync(command, { timeout: 30000 })
    const rawConfig = JSON.parse(stdout.trim())
    // Unwrap the default export if present (handle double-default from serialization)
    const config = rawConfig.default?.default ?? rawConfig.default ?? rawConfig
    return config
  })

  if (!loadResult.ok) {
    const errorCause = loadResult.error instanceof Error
      ? loadResult.error.message
      : typeof loadResult.error === 'string'
        ? loadResult.error
        : JSON.stringify(loadResult.error)
    return err(ConfigLoadError({ path: configPath, cause: errorCause }))
  }

  const config = loadResult.value

  // Validate config structure
  if (!config.collections || typeof config.collections !== 'object') {
    return err(ConfigLoadError({ path: configPath, cause: 'Config must have a collections object' }))
  }

  if (!config.db || !config.db.type) {
    return err(ConfigLoadError({ path: configPath, cause: 'Config must have a db.type property' }))
  }

  if (config.db.type !== 'postgres' && config.db.type !== 'sqlite') {
    return err(ConfigLoadError({ path: configPath, cause: `Invalid db.type: ${config.db.type}. Must be 'postgres' or 'sqlite'` }))
  }

  // Build the loaded config with proper typing
  // Extract connection string based on db type
  let connectionString: string | undefined
  if (config.db.type === 'sqlite') {
    // SQLite: connection can be { path: string } or a direct path string
    if (typeof config.db.connection === 'string') {
      connectionString = config.db.connection
    } else if (config.db.connection?.path) {
      connectionString = config.db.connection.path
    }
  } else {
    // PostgreSQL: connectionString, url, or connection are strings
    connectionString = config.db.connectionString ?? config.db.url ?? (typeof config.db.connection === 'string' ? config.db.connection : undefined)
  }

  const loadedConfig: LoadedConfig = {
    collections: config.collections as Record<string, Collection>,
    db: {
      type: config.db.type as 'postgres' | 'sqlite',
      connectionString,
    },
    migrations: config.migrations,
  }

  return ok(loadedConfig)
}
