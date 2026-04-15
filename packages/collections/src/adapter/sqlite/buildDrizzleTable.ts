/**
 * SQLite buildDrizzleTable
 *
 * Converts a RawTable (dialect-agnostic IR) to a Drizzle SQLiteTable.
 * This is part of the two-layer adapter architecture:
 *   Collection → collectionToRawTable → RawTable (Mid-Level IR) → buildDrizzleTable → Drizzle Schema
 */

import {
  sqliteTable,
  integer,
  text,
  real,
  index,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/sqlite-core'
import type { RawTable, RawColumn } from '../core/types'

/**
 * Result of buildDrizzleTable - contains the table and any created enums
 */
export interface BuildDrizzleTableResult {
  /** The built Drizzle SQLiteTable */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: ReturnType<typeof sqliteTable>
  /** Any enums - always empty for SQLite since enums use text() */
  enums: Record<string, unknown>
}

/**
 * Build a Drizzle SQLiteTable from a RawTable
 *
 * @param rawTable - The dialect-agnostic RawTable to convert
 * @param _tables - Record of previously built tables for foreign key references (reserved for future use)
 * @returns The built Drizzle SQLiteTable with any created enums (empty for SQLite)
 *
 * @example
 * ```typescript
 * import { buildDrizzleTable } from './adapter/sqlite'
 * import type { RawTable } from './adapter/core/types'
 *
 * const rawTable: RawTable = {
 *   name: 'posts',
 *   columns: {
 *     id: { type: 'integer', name: 'id', primaryKey: true, autoIncrement: true },
 *     title: { type: 'text', name: 'title', notNull: true },
 *     content: { type: 'text', name: 'content' },
 *     published: { type: 'integer', name: 'published', default: 0 },
 *     created_at: { type: 'integer', name: 'created_at', notNull: true },
 *   },
 *   indexes: {
 *     title_idx: { name: 'title_idx', on: 'title' },
 *   },
 * }
 *
 * const { table: postsTable, enums } = buildDrizzleTable(rawTable, {})
 * ```
 */
export const buildDrizzleTable = (
  rawTable: RawTable,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _tables: Record<string, any> = {},
): BuildDrizzleTableResult => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: Record<string, any> = {}
  const enums: Record<string, unknown> = {}

  // First pass: create all columns
  for (const [key, column] of Object.entries(rawTable.columns)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let col: any

    switch (column.type) {
      case 'boolean': {
        // SQLite uses integer (0/1) for booleans
        // Using integer() without mode: 'boolean' since sqlite doesn't have native boolean
        let c = integer(column.name, { mode: 'boolean' })
        if (column.default !== undefined) c = c.default(column.default as boolean)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'serial': {
        // SQLite uses INTEGER PRIMARY KEY for serial-like behavior
        // In SQLite, INTEGER PRIMARY KEY columns get AUTOINCREMENT automatically
        // Call primaryKey({ autoIncrement: true }) to enable this behavior
        let c = integer(column.name).primaryKey({ autoIncrement: true })
        if (column.notNull) c = c.notNull()
        col = c
        break
      }

      case 'integer': {
        let c = integer(column.name)
        if (column.autoIncrement) {
          // For autoIncrement, use primaryKey with autoIncrement: true
          c = c.primaryKey({ autoIncrement: true })
        }
        if (column.default !== undefined) c = c.default(column.default as number)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'numeric': {
        // SQLite has no numeric/decimal type, use real() as approximation
        let c = real(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'decimal': {
        // SQLite has no decimal type, use real() as approximation
        let c = real(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'real': {
        let c = real(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'text': {
        let c = text(column.name)
        if (column.default !== undefined) c = c.default(column.default as string)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'varchar': {
        // SQLite doesn't have varchar, use text() instead
        let c = text(column.name)
        if (column.default !== undefined) c = c.default(column.default as string)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'char': {
        // SQLite doesn't have char, use text()
        let c = text(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'date': {
        // SQLite stores dates as Unix timestamps (integer)
        let c = integer(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'timestamp': {
        // SQLite stores timestamps as Unix timestamps (integer)
        let c = integer(column.name)
        if (column.defaultNow) c = c.default(0) // SQLite doesn't have defaultNow for integer
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'timestamptz': {
        // SQLite stores timestamps as Unix timestamps (integer)
        // No timezone support in SQLite
        let c = integer(column.name)
        if (column.defaultNow) c = c.default(0)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'json': {
        // SQLite stores JSON as text
        let c = text(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'jsonb': {
        // SQLite stores JSON as text (no binary jsonb like PostgreSQL)
        let c = text(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'uuid': {
        // SQLite doesn't have native UUID, use text()
        // Note: SQLite doesn't support defaultRandom() - UUIDs must be generated at application level
        let c = text(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'enum': {
        // SQLite doesn't have enum type, use text()
        let c = text(column.name)
        if (column.default !== undefined) c = c.default(column.default as string)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      // PostgreSQL-only types that are NOT supported in SQLite
      case 'vector': {
        throw new Error('Type "vector" is not supported in SQLite adapter')
      }

      case 'halfvec': {
        throw new Error('Type "halfvec" is not supported in SQLite adapter')
      }

      case 'sparsevec': {
        throw new Error('Type "sparsevec" is not supported in SQLite adapter')
      }

      case 'bit': {
        throw new Error('Type "bit" is not supported in SQLite adapter')
      }

      default:
        throw new Error(`Unsupported column type: ${(column as RawColumn).type}`)
    }

    // Apply foreign key reference (done after all other constraints)
    if (column.reference) {
      const ref = column.reference
      col.references(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => ({} as any),
        {
          onDelete: ref.onDelete,
          onUpdate: ref.onUpdate,
        },
      )
    }

    columns[key] = col
  }

  // Create the table - pass columns directly, build indexes via callback
  // The callback receives the table with all columns, allowing proper index/constraint building
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = sqliteTable(rawTable.name, columns as any, (table) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extraConfig: Record<string, any> = {}

    if (rawTable.indexes) {
      for (const [key, rawIndex] of Object.entries(rawTable.indexes)) {
        const onFields = Array.isArray(rawIndex.on) ? rawIndex.on : [rawIndex.on]
        const idxFn = rawIndex.unique ? uniqueIndex : index
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        extraConfig[key] = (idxFn(rawIndex.name) as any).on(...onFields.map((f) => (table as any)[f]))
      }
    }

    if (rawTable.foreignKeys) {
      for (const [key, fk] of Object.entries(rawTable.foreignKeys)) {
        let builder = foreignKey({
          name: fk.name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          columns: fk.columns.map((c) => (table as any)[c]) as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          foreignColumns: fk.foreignColumns.map((fc) => (table as any)[fc.name]) as any,
        })
        if (fk.onDelete) builder = builder.onDelete(fk.onDelete)
        if (fk.onUpdate) builder = builder.onUpdate(fk.onUpdate)
        extraConfig[key] = builder
      }
    }

    return extraConfig
  })

  return { table, enums }
}