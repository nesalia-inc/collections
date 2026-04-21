/**
 * MySQL buildDrizzleTable
 *
 * Converts a RawTable (dialect-agnostic IR) to a Drizzle MySQLTable.
 * This is part of the two-layer adapter architecture:
 *   Collection → collectionToRawTable → RawTable (Mid-Level IR) → buildDrizzleTable → Drizzle Schema
 */

import {
  boolean,
  int,
  varchar,
  text,
  float,
  double,
  date,
  json,
  mysqlEnum,
  index,
  uniqueIndex,
  foreignKey,
  customType,
  mysqlTable,
} from 'drizzle-orm/mysql-core'
import type { RawTable, RawColumn } from '../core/types'

/**
 * Result of buildDrizzleTable - contains the table and any created enums
 */
export interface BuildDrizzleTableResult {
  /** The built Drizzle MySQLTable */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: ReturnType<typeof mysqlTable>
  /** Any enum values created for enum columns */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enums: Record<string, any>
}

/**
 * Build a Drizzle MySQLTable from a RawTable
 *
 * @param rawTable - The dialect-agnostic RawTable to convert
 * @param _tables - Record of previously built tables for foreign key references (reserved for future use)
 * @returns The built Drizzle MySQLTable with any created enums
 *
 * @example
 * ```typescript
 * import { buildDrizzleTable } from './adapter/mysql'
 * import type { RawTable } from './adapter/core/types'
 *
 * const rawTable: RawTable = {
 *   name: 'posts',
 *   columns: {
 *     id: { type: 'varchar', name: 'id', length: 36, primaryKey: true },
 *     title: { type: 'varchar', name: 'title', length: 255, notNull: true },
 *     content: { type: 'text', name: 'content' },
 *     published: { type: 'boolean', name: 'published', default: false },
 *     created_at: { type: 'timestamp', name: 'created_at', notNull: true },
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
    // Handle enum columns - create mysqlEnum before building the column
    if (column.type === 'enum') {
      const enumName = column.enumName
      if (!enums[enumName]) {
        enums[enumName] = mysqlEnum(enumName, column.options as [string, ...string[]])
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

      case 'serial': {
        // MySQL uses int().autoincrement() for serial-like behavior
        let c = int(column.name).autoincrement()
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'integer': {
        let c = int(column.name)
        if (column.autoIncrement) c = c.autoincrement()
        if (column.default !== undefined) c = c.default(column.default as number)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'numeric': {
        // MySQL has no native numeric type, use double as approximation
        // For precise decimal math, decimal type should be used
        let c = double(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'decimal': {
        // MySQL DECIMAL type
        let c = customType({ dataType: () => `decimal(${column.precision ?? 10}, ${column.scale ?? 0})` })(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'real': {
        // MySQL uses float for single precision
        let c = float(column.name)
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
        // MySQL VARCHAR requires a length - use column.length or default to 255
        const length = column.length ?? 255
        let c = varchar(column.name, { length })
        if (column.default !== undefined) c = c.default(column.default as string)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'char': {
        // MySQL CHAR with optional length
        let c = varchar(column.name, { length: column.length ?? 1 })
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
        // MySQL TIMESTAMP does not have timezone support - stored as local time
        // Using customType to support precision and CURRENT_TIMESTAMP default
        const precision = column.precision ?? 3
        let c = customType({ dataType: () => (column.defaultNow ? `timestamp(${precision})` : `timestamp(${precision})`) })(column.name)
        if (column.defaultNow) c = c.default('CURRENT_TIMESTAMP')
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'timestamptz': {
        // MySQL has no TIMESTAMP WITH TIME ZONE - use datetime instead
        // Timezone info is lost; application should handle timezone conversion
        // Using customType to support precision and CURRENT_TIMESTAMP default
        const precision = column.precision ?? 3
        let c = customType({ dataType: () => `datetime(${precision})` })(column.name)
        if (column.defaultNow) c = c.default('CURRENT_TIMESTAMP')
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
        // MySQL has no jsonb - use json() instead (stored as JSON, parsed on read)
        let c = json(column.name)
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'uuid': {
        // MySQL has no native UUID - use varchar(36)
        let c = varchar(column.name, { length: 36 })
        if (column.defaultRandom) {
          // MySQL doesn't support defaultRandom() - UUIDs must be generated at application level
          // or via trigger. We don't error here to maintain compatibility, but log/warn in production.
        }
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      case 'enum': {
        // Enum columns use varchar as underlying type since relations use varchar
        // The mysqlEnum is created separately and exported for type safety
        let c = varchar(column.name, { length: column.options.reduce((max, opt) => Math.max(max, opt.length), 64) })
        if (column.notNull) c = c.notNull()
        if (column.primaryKey) c = c.primaryKey()
        col = c
        break
      }

      // PostgreSQL-only types using customType
      case 'vector': {
        throw new Error('Type "vector" is not supported in MySQL adapter')
      }

      case 'halfvec': {
        throw new Error('Type "halfvec" is not supported in MySQL adapter')
      }

      case 'sparsevec': {
        throw new Error('Type "sparsevec" is not supported in MySQL adapter')
      }

      case 'bit': {
        throw new Error('Type "bit" is not supported in MySQL adapter')
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
  const table = mysqlTable(rawTable.name, columns as any, (table) => {
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
 * Create a mysqlEnum for use with enum columns
 *
 * @param name - The enum type name
 * @param values - The enum values (must have at least one value)
 * @returns The mysqlEnum for use in schema definition
 *
 * @example
 * ```typescript
 * const postStatusEnum = createMysqlEnum('post_status', ['draft', 'published', 'archived'])
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createMysqlEnum = (name: string, values: readonly [string, ...string[]]): any => {
  return mysqlEnum(name, values)
}
