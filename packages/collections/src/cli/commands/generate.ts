/**
 * Generate Command
 *
 * Generates migrations from schema changes.
 *
 * Flow:
 * 1. Load collection.config.ts dynamically
 * 2. Call buildRawSchema(collections) -> Map<string, RawTable>
 * 3. Convert RawTable[] -> Drizzle schema objects
 * 4. Generate Drizzle snapshot JSON from schema
 * 5. Call generateMigration() from drizzle-kit/api
 * 6. Write migration files to disk
 */

import fs from 'node:fs'
import path from 'node:path'
import { ok, err, error, attempt, type Result } from '@deessejs/core'
import { z } from 'zod'
import { loadConfig } from '../utils/loadConfig'
import { buildDrizzleSchema } from '../utils/buildDrizzleSchema'
import type { GenerateOptions } from '../index'
import type { Collection } from '../../collections'

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

const SchemaBuildError = error({
  name: 'SchemaBuildError',
  schema: z.object({
    cause: z.string(),
  }),
  message: (args) => `Failed to build schema: ${args.cause}`,
})

const GenerateError = error({
  name: 'GenerateError',
  schema: z.object({
    cause: z.string(),
  }),
  message: (args) => `Generation failed: ${args.cause}`,
})

const WriteMigrationError = error({
  name: 'WriteMigrationError',
  schema: z.object({
    path: z.string(),
    cause: z.string(),
  }),
  message: (args) => `Failed to write migration file ${args.path}: ${args.cause}`,
})

export type GenerateErrorType = ReturnType<
  typeof ConfigLoadError | typeof SchemaBuildError | typeof GenerateError | typeof WriteMigrationError
>

// ============================================================================
// Migration File Writing
// ============================================================================

/**
 * Write migration SQL to a file
 */
const writeMigrationFile = (
  outDir: string,
  migrationName: string,
  sql: string
): Result<string, ReturnType<typeof WriteMigrationError>> => {
  // Create migration filename with timestamp prefix
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]
  const filename = `${timestamp}_${migrationName}.sql`
  const filePath = path.join(outDir, filename)

  // Create parent directories if they don't exist
  const dirResult = attempt(() => fs.mkdirSync(outDir, { recursive: true }))
  if (!dirResult.ok) {
    return err(WriteMigrationError({ path: filePath, cause: String(dirResult.error) }))
  }

  // Write the migration file
  const writeResult = attempt(() => fs.writeFileSync(filePath, sql, 'utf-8'))
  if (!writeResult.ok) {
    return err(WriteMigrationError({ path: filePath, cause: String(writeResult.error) }))
  }

  return ok(filePath)
}

// ============================================================================
// Generate Command
// ============================================================================

/**
 * Generate migrations from schema changes
 */
export const generate = async (options: GenerateOptions): Promise<Result<Unit, GenerateErrorType>> => {
  const verbose = options.verbose ?? false
  const configPath = options.config ?? './collection.config.ts'
  const migrationName = options.name ?? `migration_${Date.now()}`

  if (verbose) {
    console.log('[verbose] Loading config from:', configPath)
  }

  // Step 1: Load config
  const configResult = await loadConfig(configPath)
  if (!configResult.ok) {
    return err(ConfigLoadError({ path: configPath, cause: String(configResult.error) }))
  }

  const config = configResult.value
  const collections = Object.values(config.collections) as Collection[]
  const dbType = config.db.type
  const migrationsDir = config.migrations?.dir ?? './drizzle'
  const outDir = options.out ?? migrationsDir

  if (verbose) {
    console.log('[verbose] Loaded', collections.length, 'collections')
    console.log('[verbose] Database type:', dbType)
    console.log('[verbose] Output directory:', outDir)
  }

  // Step 2: Build Drizzle schema
  if (verbose) {
    console.log('[verbose] Building Drizzle schema...')
  }

  const schemaResult = buildDrizzleSchema(collections, dbType)
  if (!schemaResult.ok) {
    return err(SchemaBuildError({ cause: String(schemaResult.error) }))
  }

  const { schema: drizzleSchema } = schemaResult.value

  if (verbose) {
    console.log('[verbose] Schema built with', Object.keys(drizzleSchema).length, 'tables')
  }

  // Step 3: Generate migration using drizzle-kit/api
  if (verbose) {
    console.log('[verbose] Generating migration...')
  }

  try {
    // Dynamic import of drizzle-kit/api functions
    if (dbType === 'sqlite') {
      const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import('drizzle-kit/api')

      // Generate snapshot from current schema
      const curSnapshot = await generateSQLiteDrizzleJson(drizzleSchema)

      // For initial migration, prev is an empty schema with originUUID as prevId
      const prevSnapshot = {
        id: '00000000-0000-0000-0000-000000000000',
        version: '6',
        dialect: 'sqlite' as const,
        prevId: '00000000-0000-0000-0000-000000000000',
        tables: {},
        enums: {},
        views: {},
        _meta: {
          tables: {},
          columns: {},
        },
      }

      const migrationSql = await generateSQLiteMigration(prevSnapshot, curSnapshot)

      if (verbose) {
        console.log('[verbose] Migration generated')
        console.log('[verbose] SQL statements:', migrationSql.length)
      }

      // Step 4: Write migration file
      const writeResult = writeMigrationFile(outDir, migrationName, migrationSql.join('\n'))
      if (!writeResult.ok) {
        return err(writeResult.error)
      }

      const filePath = writeResult.value
      console.log('\n=== Migration Generated ===\n')
      console.log(`Migration: ${migrationName}`)
      console.log(`Output: ${filePath}`)
      console.log(`Statements: ${migrationSql.length}`)
    } else {
      // PostgreSQL
      const { generateDrizzleJson, generateMigration } = await import('drizzle-kit/api')

      // Generate snapshot from current schema
      const curSnapshot = await generateDrizzleJson(drizzleSchema)

      // For initial migration, prev is an empty schema with originUUID as prevId
      const prevSnapshot = {
        id: '00000000-0000-0000-0000-000000000000',
        version: '7',
        dialect: 'postgresql' as const,
        prevId: '00000000-0000-0000-0000-000000000000',
        tables: {},
        enums: {},
        schemas: {},
        sequences: {},
        roles: {},
        policies: {},
        views: {},
        matViews: {},
        _meta: {
          schemas: {},
          tables: {},
          columns: {},
        },
      }

      const migrationSql = await generateMigration(prevSnapshot, curSnapshot)

      if (verbose) {
        console.log('[verbose] Migration generated')
        console.log('[verbose] SQL statements:', migrationSql.length)
      }

      // Step 4: Write migration file
      const writeResult = writeMigrationFile(outDir, migrationName, migrationSql.join('\n'))
      if (!writeResult.ok) {
        return err(writeResult.error)
      }

      const filePath = writeResult.value
      console.log('\n=== Migration Generated ===\n')
      console.log(`Migration: ${migrationName}`)
      console.log(`Output: ${filePath}`)
      console.log(`Statements: ${migrationSql.length}`)
    }

    return ok({})
  } catch (e) {
    return err(GenerateError({ cause: String(e) }))
  }
}

// Unit type for void returns
type Unit = Record<never, never>
