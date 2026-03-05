import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { pushSchema, generateMigration, generateDrizzleJson } from 'drizzle-kit/api'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

import type { PgAdapter } from './adapter'
import type { Collection } from './collection'
import { buildSchema } from './schema'

/**
 * Migration options
 */
export type MigrationOptions = {
  /** Output directory for generated files */
  out?: string
  /** Enable verbose output */
  verbose?: boolean
  /** Dry run mode - don't apply changes */
  dryRun?: boolean
}

/**
 * Push result
 */
export type PushResult = {
  /** SQL statements to be executed */
  statements: string[]
  /** Warnings during push */
  warnings: string[]
  /** Apply the changes to database */
  apply: () => Promise<void>
}

/**
 * Generate result
 */
export type GenerateResult = {
  /** SQL statements for the migration */
  sql: string[]
  /** Directory where migration was saved */
  directory?: string
}

/**
 * Get the path to the schema JSON file
 */
function getSchemaJsonPath(outputDir: string): string {
  return join(outputDir, 'schema.json')
}

/**
 * Load existing schema JSON from file
 */
function loadExistingSchema(outputDir: string): Record<string, unknown> | null {
  const schemaPath = getSchemaJsonPath(outputDir)

  if (!existsSync(schemaPath)) {
    return null
  }

  try {
    const content = readFileSync(schemaPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * Save schema JSON to file
 */
function saveSchemaJson(outputDir: string, schema: Record<string, unknown>): void {
  const schemaPath = getSchemaJsonPath(outputDir)

  // Ensure directory exists
  const dir = dirname(schemaPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  writeFileSync(schemaPath, JSON.stringify(schema, null, 2))
}

/**
 * Push schema to database (development mode)
 *
 * Uses drizzle-kit programmatic API to push schema changes to the database
 *
 * @example
 * import { push } from '@deessejs/collections'
 * import { pgAdapter } from '@deessejs/collections'
 *
 * const adapter = pgAdapter({ url: process.env.DATABASE_URL })
 * const result = await push(adapter, collections)
 *
 * // Preview changes without applying
 * console.log(result.statements)
 *
 * // Apply changes
 * await result.apply()
 */
export const push = async (
  adapter: PgAdapter,
  collections: Collection[],
  options: MigrationOptions = {}
): Promise<PushResult> => {
  const { verbose = false, dryRun = false, out = './drizzle' } = options

  // Build schema from collections
  const schema = buildSchema(collections)

  // Create pool and drizzle instance
  const pool = new Pool({
    connectionString: adapter.config.url
  })

  try {
    const db = drizzle(pool, { schema }) as any

    // Use pushSchema from drizzle-kit API
    const result = await pushSchema(schema, db)

    if (verbose) {
      console.log('[collections] Warnings:', result.warnings)
      console.log('[collections] Statements to execute:', result.statementsToExecute.length)
    }

    // Save the new schema after push
    const schemaJson = generateDrizzleJson(schema)
    saveSchemaJson(out, schemaJson)

    return {
      statements: result.statementsToExecute,
      warnings: result.warnings,
      apply: async () => {
        if (dryRun) {
          if (verbose) {
            console.log('[collections] Dry run - not applying changes')
          }
          return
        }
        await result.apply()
        if (verbose) {
          console.log('[collections] Schema pushed successfully')
        }
      }
    }
  } finally {
    await pool.end()
  }
}

/**
 * Generate migration files
 *
 * Uses drizzle-kit programmatic API to create migration files by comparing
 * the current schema against the saved schema from a previous push.
 *
 * @example
 * import { generate } from '@deessejs/collections'
 * import { pgAdapter } from '@deessejs/collections'
 *
 * const adapter = pgAdapter({ url: process.env.DATABASE_URL })
 * const result = await generate(adapter, collections, { out: './drizzle' })
 *
 * console.log(result.sql) // SQL statements
 */
export const generate = async (
  _adapter: PgAdapter,
  collections: Collection[],
  options: MigrationOptions = {}
): Promise<GenerateResult> => {
  const { verbose = false, out = './drizzle' } = options

  // Build schema from collections
  const schema = buildSchema(collections)

  // Generate new schema JSON
  const newJson = generateDrizzleJson(schema)

  // Load existing schema JSON (from previous push)
  const existingJson = loadExistingSchema(out)

  // Generate migration SQL by comparing existing vs new schema
  const sqlStatements = await generateMigration(existingJson, newJson)

  if (verbose) {
    console.log('[collections] Migration SQL generated')
    console.log('[collections] Statements:', sqlStatements.length)
    if (existingJson) {
      console.log('[collections] Compared against existing schema')
    } else {
      console.log('[collections] No existing schema found, generating initial migration')
    }
  }

  // Save the new schema
  saveSchemaJson(out, newJson)

  return {
    sql: sqlStatements,
    directory: out
  }
}

/**
 * Apply migrations
 *
 * Note: With the programmatic API, migrations are applied automatically
 * when using push(). This function is kept for API compatibility.
 *
 * @example
 * import { migrate } from '@deessejs/collections'
 * import { pgAdapter } from '@deessejs/collections'
 *
 * const adapter = pgAdapter({ url: process.env.DATABASE_URL })
 * await migrate(adapter)
 */
export const migrate = async (
  _adapter: PgAdapter,
  _options: MigrationOptions = {}
): Promise<void> => {
  // With programmatic API, migrations are handled by push()
  // This is kept for backward compatibility
  console.warn('[collections] migrate() is deprecated. Use push() instead.')
}
