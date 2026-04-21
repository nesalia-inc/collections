/**
 * createMysqlSchema - Combines buildRawSchema and buildDrizzleTable
 *
 * This function is part of the two-layer adapter architecture:
 *   Collections → buildRawSchema → Map<string, RawTable> → buildDrizzleTable → Drizzle Schema
 *
 * It provides a convenient single call to convert Collections directly to Drizzle tables.
 */

import { buildRawSchema } from '../core/buildRawSchema'
import { buildDrizzleTable } from './buildDrizzleTable'
import type { Field } from '../../fields'
import type { Collection } from '../../collections'

/**
 * Options for creating MySQL schema
 */
export interface CreateMysqlSchemaOptions {
  /** Whether to include enums in the returned schema (default: true) */
  includeEnums?: boolean
}

/**
 * Create a complete MySQL schema from Collections
 *
 * @param collections - Array of Collection objects
 * @param options - Optional configuration options
 * @returns Object with table names as keys and their Drizzle MySQL tables as values,
 *          plus any created enums at the top level
 *
 * @example
 * ```typescript
 * const posts = collection({ slug: 'posts', fields: { title: field({ fieldType: f.text() }) } })
 * const users = collection({ slug: 'users', fields: { name: field({ fieldType: f.text() }) } })
 *
 * const schema = createMysqlSchema([posts, users])
 * // Returns: { posts: MySQLTable, users: MySQLTable }
 * ```
 *
 * @example
 * ```typescript
 * // With options
 * const schema = createMysqlSchema([posts, users], { includeEnums: true })
 * ```
 */
export const createMysqlSchema = (
  collections: Collection<string, Record<string, Field<unknown>>>[],
  options?: CreateMysqlSchemaOptions,
) => {
  const rawSchema = buildRawSchema(collections)
  const schema: Record<string, unknown> = {}
  const enums: Record<string, unknown> = {}
  const includeEnums = options?.includeEnums ?? true

  for (const [name, rawTable] of rawSchema) {
    const result = buildDrizzleTable(rawTable)
    schema[name] = result.table
    if (includeEnums) {
      Object.assign(enums, result.enums)
    }
  }

  return includeEnums ? { ...schema, ...enums } : schema
}
