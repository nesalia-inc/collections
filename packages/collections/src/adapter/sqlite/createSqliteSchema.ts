/**
 * createSqliteSchema - Combines buildRawSchema and buildDrizzleTable
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
 * Create a complete SQLite schema from Collections
 *
 * @param collections - Array of Collection objects
 * @returns Object with table names as keys and their Drizzle SQLite tables as values,
 *          plus any created enums at the top level (empty for SQLite since enums use text())
 *
 * @example
 * ```typescript
 * const posts = collection({ slug: 'posts', fields: { title: field({ fieldType: f.text() }) } })
 * const users = collection({ slug: 'users', fields: { name: field({ fieldType: f.text() }) } })
 *
 * const schema = createSqliteSchema([posts, users])
 * // Returns: { posts: SQLiteTable, users: SQLiteTable }
 * ```
 */
export const createSqliteSchema = (
  collections: Collection<string, Record<string, Field<unknown>>>[]
) => {
  const rawSchema = buildRawSchema(collections)
  const schema: Record<string, unknown> = {}

  for (const [name, rawTable] of rawSchema) {
    const result = buildDrizzleTable(rawTable)
    schema[name] = result.table
  }

  return schema
}