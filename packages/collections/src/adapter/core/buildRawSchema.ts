/**
 * buildRawSchema - Builds a complete schema from multiple Collections
 *
 * This function is part of the two-layer adapter architecture:
 *   Collections → buildRawSchema → Map<string, RawTable> → buildDrizzleTable → Drizzle Schema
 *
 * This function:
 * - Converts each Collection to a RawTable
 * - Resolves foreign key references between collections
 */

import type { Field } from '../../fields'
import type { Collection } from '../../collections'
import type { RawTable, RawForeignKey, JunctionTable, RawColumn } from './types'
import { collectionToRawTable, collectionSlugToTableName } from './collectionToRawTable'
import type { FieldToRawColumnOptions } from './fieldToRawColumn'

/**
 * Options for buildRawSchema
 */
export interface BuildRawSchemaOptions {
  /**
   * Prefix for enum column names
   * e.g., 'post_' → 'post_status' instead of 'status'
   */
  readonly enumNamePrefix?: string

  /**
   * Optional function to resolve relation field names to target collection slugs
   * By default, uses a naming convention: 'author' → 'author', 'authorId' → 'author'
   *
   * @param fieldName - The field name (e.g., 'authorId', 'category_id')
   * @returns The target collection slug or undefined if cannot resolve
   */
  readonly resolveRelation?: (fieldName: string) => string | undefined
}

/**
 * Builds a complete schema from multiple collections
 *
 * @param collections - Array of Collection objects
 * @param options - Optional configuration
 * @returns Map of table name to RawTable with resolved foreign keys
 *
 * @example
 * ```typescript
 * const posts = collection({ slug: 'posts', fields: { author: field({ fieldType: f.relation() }) } })
 * const users = collection({ slug: 'users', fields: { name: field({ fieldType: f.text() }) } })
 *
 * const schema = buildRawSchema([posts, users])
 * // Returns Map with 'posts' and 'users' tables, with FK on posts.author_id → users.id
 * ```
 */
export const buildRawSchema = (
  collections: Collection<string, Record<string, Field<unknown>>>[],
  options?: BuildRawSchemaOptions
): Map<string, RawTable> => {
  const resolveRelation = options?.resolveRelation ?? defaultResolveRelation
  const enumNamePrefix = options?.enumNamePrefix

  // Build a map of collection slugs to collections for lookup
  const collectionMap = new Map<string, Collection<string, Record<string, Field<unknown>>>>()
  for (const collection of collections) {
    collectionMap.set(collection.slug, collection)
  }

  // Convert all collections to RawTables
  const rawTables = new Map<string, RawTable>()
  const allJunctionTables: JunctionTable[] = []

  for (const collection of collections) {
    const result = collectionToRawTable(
      collection as Collection<string, Record<string, Field<unknown>>>,
      { enumNamePrefix } as FieldToRawColumnOptions | undefined
    )
    if (!result.ok) {
      throw result.error
    }
    rawTables.set(result.value.table.name, result.value.table)
    allJunctionTables.push(...result.value.junctionTables)
  }

  // Add junction tables to the schema
  for (const junction of allJunctionTables) {
    // Convert JunctionTable to RawTable format
    const junctionAsRawTable: RawTable = {
      name: junction.name,
      columns: {
        id: junction.columns.id as RawColumn,
        _parent_id: junction.columns._parent_id as RawColumn,
        _order: junction.columns._order as RawColumn,
        value: junction.columns.value as RawColumn,
      },
      foreignKeys: {
        _parent_id_fk: {
          name: '_parent_id_fk',
          columns: ['_parent_id'],
          foreignColumns: [{ name: 'id', table: junction.parentTable }],
          onDelete: 'cascade',
        },
        value_fk: {
          name: 'value_fk',
          columns: ['value'],
          foreignColumns: [{ name: 'id', table: junction.targetTable }],
          onDelete: 'cascade',
        },
      },
    }
    rawTables.set(junction.name, Object.freeze(junctionAsRawTable))
  }

  // Now resolve foreign keys by looking at uuid columns in each table
  // that reference other tables
  for (const [tableName, rawTable] of rawTables) {
    const foreignKeys: Record<string, RawForeignKey> = {}

    for (const [columnName, column] of Object.entries(rawTable.columns)) {
      // Skip non-uuid columns
      if (column.type !== 'uuid') continue

      // Skip primary key columns (id fields)
      if (column.primaryKey) continue

      // Skip columns with defaultRandom (these are auto-generated UUIDs, not relations)
      if ('defaultRandom' in column && column.defaultRandom) continue

      // This is likely a relation column - try to resolve the target table
      // Use the resolveRelation function to convert column name to potential collection slug
      // e.g., 'author_id' → 'author' → looks for 'author' collection
      // e.g., 'user_id' → 'user' → looks for 'user' collection

      const potentialSlug = resolveRelation(columnName)
      if (!potentialSlug) continue

      const targetCollection = collectionMap.get(potentialSlug)

      if (targetCollection) {
        const fkName = `${columnName}_fk`
        foreignKeys[fkName] = {
          name: fkName,
          columns: [columnName],
          foreignColumns: [{ name: 'id', table: collectionSlugToTableName(targetCollection.slug) }],
        }
      }
    }

    // Add foreign keys to the table if any were found
    if (Object.keys(foreignKeys).length > 0) {
      // We need to create a new object with foreignKeys
      rawTables.set(tableName, {
        ...rawTable,
        foreignKeys,
      })
    }
  }

  return rawTables
}

/**
 * Default relation resolver
 *
 * Converts field names to collection slugs using these rules:
 * - 'authorId' → 'author'
 * - 'category_id' → 'category'
 * - 'author' → 'author'
 */
const defaultResolveRelation = (fieldName: string): string | undefined => {
  // Remove trailing 'Id' suffix: 'authorId' → 'author', 'authorID' → 'author'
  // Also handle '_id' suffix: 'category_id' → 'category'
  const normalized = fieldName.replace(/Id$/, '').replace(/_id$/, '')

  return normalized
}
