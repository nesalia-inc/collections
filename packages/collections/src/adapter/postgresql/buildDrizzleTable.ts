/**
 * PostgreSQL buildDrizzleTable
 *
 * Converts a RawTable (dialect-agnostic IR) to a Drizzle PgTable.
 * This is part of the two-layer adapter architecture:
 *   Collection → collectionToRawTable → RawTable (Mid-Level IR) → buildDrizzleTable → Drizzle Schema
 */

import {
  boolean,
  integer,
  serial,
  numeric,
  decimal,
  real,
  text,
  varchar,
  char,
  date,
  timestamp,
  json,
  jsonb,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
  foreignKey,
  customType,
  pgTable,
} from 'drizzle-orm/pg-core'
import type { RawTable, RawColumn } from '../core/types'

/**
 * Result of buildDrizzleTable - contains the table and any created enums
 */
export interface BuildDrizzleTableResult {
  /** The built Drizzle PgTable */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: ReturnType<typeof pgTable>
  /** Any pgEnum values created for enum columns */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enums: Record<string, any>
}

/**
 * Build a Drizzle PgTable from a RawTable
 *
 * @param rawTable - The dialect-agnostic RawTable to convert
 * @param _tables - Record of previously built tables for foreign key references (reserved for future use)
 * @returns The built Drizzle PgTable with any created enums
 *
 * @example
 * ```typescript
 * import { buildDrizzleTable } from './adapter/postgresql'
 * import type { RawTable } from './adapter/core/types'
 *
 * const rawTable: RawTable = {
 *   name: 'posts',
 *   columns: {
 *     id: { type: 'uuid', name: 'id', primaryKey: true, defaultRandom: true, notNull: true },
 *     title: { type: 'varchar', name: 'title', length: 255, notNull: true },
 *     content: { type: 'text', name: 'content' },
 *     published: { type: 'boolean', name: 'published', default: false },
 *     created_at: { type: 'timestamp', name: 'created_at', defaultNow: true, notNull: true },
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enums: Record<string, any> = {}

  // First pass: create all columns and collect enum definitions
  for (const [key, column] of Object.entries(rawTable.columns)) {
    // Handle enum columns - create pgEnum before building the column
    if (column.type === 'enum') {
      const enumName = column.enumName
      if (!enums[enumName]) {
        enums[enumName] = pgEnum(enumName, column.options as [string, ...string[]])
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let col: any

    switch (column.type) {
      case 'boolean': {
        let c = boolean(column.name)
        if (column.default !== undefined) c = c.default(column.default as boolean)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'serial':
        col = serial(column.name)
        break

      case 'integer': {
        let c = integer(column.name)
        if (column.default !== undefined) c = c.default(column.default as number)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'numeric': {
        let c = numeric(column.name, { precision: column.precision, scale: column.scale })
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'decimal': {
        let c = decimal(column.name, { precision: column.precision, scale: column.scale })
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
        let c = varchar(column.name, { length: column.length })
        if (column.default !== undefined) c = c.default(column.default as string)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'char': {
        let c = char(column.name, { length: column.length })
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'date': {
        let c = date(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'timestamp': {
        let c = timestamp(column.name, {
          precision: (column.precision ?? 3) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          withTimezone: column.withTimezone ?? false,
        })
        if (column.defaultNow) c = c.defaultNow()
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'timestamptz': {
        let c = timestamp(column.name, {
          precision: (column.precision ?? 3) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          withTimezone: true,
        })
        if (column.defaultNow) c = c.defaultNow()
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'json': {
        let c = json(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'jsonb': {
        let c = jsonb(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'uuid': {
        let c = uuid(column.name)
        if (column.defaultRandom) c = c.defaultRandom()
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'enum': {
        // Enum columns use uuid() as the underlying type since relations use uuid
        // The pgEnum is created separately and exported for type safety
        let c = uuid(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      // PostgreSQL-only types using customType
      case 'vector': {
        let c = customType({ dataType: () => `vector(${column.dimensions ?? 1536})` })(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'halfvec': {
        let c = customType({ dataType: () => `halfvec(${column.dimensions ?? 2048})` })(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'sparsevec': {
        let c = customType({ dataType: () => `sparsevec(${column.dimensions ?? 1000})` })(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'bit': {
        let c = customType({ dataType: () => `bit(${column.dimensions ?? 1})` })(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      default:
        throw new Error(`Unsupported column type: ${(column as RawColumn).type}`)
    }

    // NOTE: Foreign key references are handled at the table level via rawTable.foreignKeys
    // Do not apply .references() here during column building as we don't have access
    // to other tables. The FK constraints are created separately in buildRawSchema.

    columns[key] = col
  }

  // Create the table - pass columns directly, build indexes via callback
  // The callback receives the table with all columns, allowing proper index/constraint building
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = pgTable(rawTable.name, columns as any, (table) => {
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

/**
 * Create a pgEnum for use with enum columns
 *
 * @param name - The enum type name
 * @param values - The enum values (must have at least one value)
 * @returns The pgEnum for use in schema definition
 *
 * @example
 * ```typescript
 * const postStatusEnum = createPgEnum('post_status', ['draft', 'published', 'archived'])
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createPgEnum = (name: string, values: readonly [string, ...string[]]): any => {
  return pgEnum(name, values)
}
