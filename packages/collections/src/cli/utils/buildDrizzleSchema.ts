/**
 * Build Drizzle Schema
 *
 * Converts Collection definitions to Drizzle schema objects for use with drizzle-kit.
 */

import { err, ok, error, type Result } from '@deessejs/core'
import { z } from 'zod'
import type { Field } from '../../fields'
import type { Collection } from '../../collections'
import { buildRawSchema } from '../../adapter/core/buildRawSchema'
import { buildDrizzleTable as buildSqliteDrizzleTable } from '../../adapter/sqlite/buildDrizzleTable'
import { buildDrizzleTable as buildPostgresDrizzleTable } from '../../adapter/postgresql/buildDrizzleTable'
import type { RawTable } from '../../adapter/core/types'

// ============================================================================
// Error Types
// ============================================================================

const SchemaBuildError = error({
  name: 'SchemaBuildError',
  schema: z.object({
    cause: z.string(),
  }),
  message: (args) => `Failed to build schema: ${args.cause}`,
})

export type SchemaBuildErrorType = ReturnType<typeof SchemaBuildError>

// ============================================================================
// Build Drizzle Schema
// ============================================================================

/**
 * Result of building a Drizzle schema
 */
export interface BuildDrizzleSchemaResult {
  /** The Drizzle schema object (Record of table names to Drizzle tables) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: Record<string, any>
  /** Any enums created during schema building (for PostgreSQL) */
  enums: Record<string, unknown>
}

/**
 * Build a Drizzle schema from collections
 *
 * @param collections - Array of Collection objects
 * @param dbType - Database type ('postgres' | 'sqlite')
 * @returns Result containing the Drizzle schema or an error
 */
export const buildDrizzleSchema = (
  collections: Collection<string, Record<string, Field<unknown>>>[],
  dbType: 'postgres' | 'sqlite'
): Result<BuildDrizzleSchemaResult, SchemaBuildErrorType> => {
  try {
    // Step 1: Convert collections to RawTable map using buildRawSchema
    const rawSchema: Map<string, RawTable> = buildRawSchema(collections)

    // Step 2: Convert RawTable map to dialect-specific Drizzle schema
    const schema: Record<string, unknown> = {}
    const enums: Record<string, unknown> = {}

    const buildDrizzleTable = dbType === 'postgres'
      ? buildPostgresDrizzleTable
      : buildSqliteDrizzleTable

    for (const [name, rawTable] of rawSchema) {
      const result = buildDrizzleTable(rawTable)
      schema[name] = result.table
      Object.assign(enums, result.enums)
    }

    return ok({ schema, enums })
  } catch (e) {
    return err(SchemaBuildError({ cause: String(e) }))
  }
}
