# PostgreSQL Implementation

## Layer 2: Dialect-Specific Drizzle Conversion

```typescript
// src/adapter/postgres/schema/buildDrizzleTable.ts

import {
  boolean, integer, serial, numeric, real, text, varchar, timestamp, date, uuid, jsonb,
  index, uniqueIndex, foreignKey, customType, pgEnum, type IndexBuilder, type ForeignKeyBuilder
} from 'drizzle-orm/pg-core'
import type { RawTable, RawColumn } from '../core/types'

// NOTE: adapter.pgSchema.enum() is used in the code below
// This assumes the PostgresAdapter has a pgSchema property
// Alternatively, use pgEnum() standalone: pgEnum('name', ['val1', 'val2'])

// Helper to validate field name exists in table (SQL injection prevention)
const validateField = (table: Record<string, unknown>, field: string): unknown => {
  if (!(field in table)) {
    throw new Error(`Invalid field name: ${field}`)
  }
  return table[field]
}

export const buildDrizzleTable = ({
  adapter,
  rawTable
}: {
  adapter: PostgresAdapter
  rawTable: RawTable
}) => {
  const columns: Record<string, ReturnType<typeof boolean>> = {}

  for (const [key, column] of Object.entries(rawTable.columns)) {
    let col: ReturnType<typeof boolean> | ReturnType<typeof integer> | ReturnType<typeof text> | unknown

    switch (column.type) {
      case 'boolean':
        col = boolean(column.name)
        if (column.default !== undefined) col = col.default(column.default)
        break

      case 'serial':
        col = serial(column.name)
        break

      case 'integer':
        col = integer(column.name)
        if (column.autoIncrement) col = col.autoincrement()
        if (column.notNull) col = col.notNull()
        if (column.default !== undefined) col = col.default(column.default)
        break

      case 'numeric':
        col = numeric(column.name, { precision: column.precision, scale: column.scale })
        if (column.notNull) col = col.notNull()
        break

      case 'decimal':
        col = numeric(column.name, { precision: column.precision, scale: column.scale })
        if (column.notNull) col = col.notNull()
        break

      case 'real':
        col = real(column.name)
        if (column.notNull) col = col.notNull()
        break

      case 'text':
        col = text(column.name)
        if (column.notNull) col = col.notNull()
        if (column.default !== undefined) col = col.default(column.default)
        break

      case 'varchar':
        col = varchar(column.name, { length: column.length })
        if (column.notNull) col = col.notNull()
        if (column.default !== undefined) col = col.default(column.default)
        break

      case 'char':
        col = varchar(column.name, { length: column.length }) // PostgreSQL uses varchar for char
        if (column.notNull) col = col.notNull()
        break

      case 'date':
        col = date(column.name)
        if (column.notNull) col = col.notNull()
        break

      case 'timestamp':
        col = timestamp(column.name, {
          precision: column.precision ?? 3,
          withTimezone: column.withTimezone ?? false
        })
        if (column.defaultNow) col = col.defaultNow()
        if (column.notNull) col = col.notNull()
        break

      case 'timestamptz':
        col = timestamp(column.name, {
          precision: column.precision ?? 3,
          withTimezone: true
        })
        if (column.defaultNow) col = col.defaultNow()
        if (column.notNull) col = col.notNull()
        break

      case 'json':
        col = jsonb(column.name)
        if (column.notNull) col = col.notNull()
        break

      case 'jsonb':
        col = jsonb(column.name)
        if (column.notNull) col = col.notNull()
        break

      case 'uuid':
        col = uuid(column.name)
        if (column.defaultRandom) col = col.defaultRandom()
        if (column.notNull) col = col.notNull()
        break

      case 'enum':
        // FIXED: Use enumName for the type, not column name
        if (!adapter.enums[column.enumName]) {
          adapter.enums[column.enumName] = adapter.pgSchema.enum(
            column.enumName,
            column.options as [string, ...string[]]
          )
        }
        col = adapter.enums[column.enumName](column.name)
        if (column.notNull) col = col.notNull()
        break

      // PostgreSQL-only types
      case 'vector':
        col = customType({ dataType: () => `vector(${column.dimensions ?? 1536})` })(column.name)
        break

      case 'halfvec':
        col = customType({ dataType: () => `halfvec(${column.dimensions ?? 2048})` })(column.name)
        break

      case 'sparsevec':
        col = customType({ dataType: () => `sparsevec(${column.dimensions ?? 1000})` })(column.name)
        break

      case 'bit':
        col = customType({ dataType: () => `bit(${column.dimensions ?? 1})` })(column.name)
        break

      default:
        throw new Error(`Unsupported column type: ${(column as RawColumn).type}`)
    }

    columns[key] = col

    // Apply primary key constraint
    if (column.primaryKey) {
      columns[key] = (columns[key] as any).primaryKey()
    }

    // Apply foreign key reference
    if (column.reference) {
      const ref = column.reference
      ;(columns[key] as any).references(
        () => adapter.tables[ref.table][ref.name],
        { onDelete: ref.onDelete, onUpdate: ref.onUpdate }
      )
    }
  }

  // Handle indexes and foreign keys via extraConfig (must be after all columns defined)
  const extraConfig = (cols: Record<string, unknown>) => {
    const config: Record<string, IndexBuilder | ForeignKeyBuilder> = {}

    if (rawTable.indexes) {
      for (const [key, rawIndex] of Object.entries(rawTable.indexes)) {
        const fn = rawIndex.unique ? uniqueIndex : index
        if (Array.isArray(rawIndex.on)) {
          config[key] = fn(rawIndex.name).on(...rawIndex.on.map(c => validateField(cols, c)))
        } else {
          config[key] = fn(rawIndex.name).on(validateField(cols, rawIndex.on))
        }
      }
    }

    if (rawTable.foreignKeys) {
      for (const [key, fk] of Object.entries(rawTable.foreignKeys)) {
        let builder = foreignKey({
          name: fk.name,
          columns: fk.columns.map(c => validateField(cols, c)) as any,
          foreignColumns: fk.foreignColumns.map(c => validateField(adapter.tables[c.table], c.name)) as any
        })
        if (fk.onDelete) builder = builder.onDelete(fk.onDelete)
        if (fk.onUpdate) builder = builder.onUpdate(fk.onUpdate)
        config[key] = builder
      }
    }

    return config
  }

  adapter.tables[rawTable.name] = adapter.pgSchema.table(
    rawTable.name,
    columns as any,
    extraConfig as any
  )
}
```
