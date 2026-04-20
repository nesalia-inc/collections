# SQLite Implementation

```typescript
// src/adapter/sqlite/schema/buildDrizzleTable.ts

import {
  integer, numeric, real, text, index, uniqueIndex, foreignKey, sqliteTable
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import type { RawTable, RawColumn } from '../core/types'

export const buildDrizzleTable = ({
  adapter,
  rawTable
}: {
  adapter: SQLiteAdapter
  rawTable: RawTable
}) => {
  const columns: Record<string, ReturnType<typeof integer> | ReturnType<typeof text> | unknown> = {}

  for (const [key, column] of Object.entries(rawTable.columns)) {
    let col: unknown

    switch (column.type) {
      case 'boolean':
        col = integer(column.name, { mode: 'boolean' })
        if (column.default !== undefined) col = col.default(column.default ? sql`1` : sql`0`)
        break

      case 'serial':
      case 'integer':
        col = integer(column.name)
        if (column.autoIncrement || column.primaryKey) col = col.autoincrement()
        if (column.notNull) col = col.notNull()
        if (column.default !== undefined) col = col.default(column.default)
        break

      case 'numeric':
      case 'decimal':
        col = numeric(column.name, { mode: 'number' })
        if (column.notNull) col = col.notNull()
        break

      case 'real':
        col = real(column.name)
        if (column.notNull) col = col.notNull()
        break

      case 'text':
      case 'varchar':
      case 'char':
        col = text(column.name)
        if (column.notNull) col = col.notNull()
        if (column.default !== undefined) col = col.default(column.default)
        break

      case 'date':
        // SQLite stores dates as text in ISO 8601 format
        col = text(column.name)
        if (column.notNull) col = col.notNull()
        break

      case 'timestamp':
        // Use integer with timestamp mode for automatic Date conversion
        col = integer(column.name, { mode: 'timestamp' })
        if (column.defaultNow) col = col.defaultNow()
        if (column.notNull) col = col.notNull()
        break

      case 'timestamptz':
        // Use integer with timestamp_ms mode for timezone-aware timestamps
        col = integer(column.name, { mode: 'timestamp_ms' })
        if (column.defaultNow) col = col.defaultNow()
        if (column.notNull) col = col.notNull()
        break

      case 'json':
      case 'jsonb':
        col = text(column.name, { mode: 'json' })
        if (column.notNull) col = col.notNull()
        break

      case 'uuid':
        // UUIDs are stored as text - Drizzle handles conversion
        col = text(column.name)
        if (column.defaultRandom) {
          col = col.$defaultFn(() => uuidv4())
        }
        if (column.notNull) col = col.notNull()
        break

      case 'enum':
        col = text(column.name, { enum: column.options as [string, ...string[]] })
        if (column.notNull) col = col.notNull()
        break

      default:
        throw new Error(`Unsupported SQLite column type: ${(column as RawColumn).type}`)
    }

    columns[key] = col

    if (column.primaryKey) {
      columns[key] = (columns[key] as any).primaryKey({ autoIncrement: column.type === 'serial' || column.autoIncrement })
    }

    if (column.reference) {
      const ref = column.reference
      ;(columns[key] as any).references(
        () => adapter.tables[ref.table][ref.name],
        { onDelete: ref.onDelete }
      )
    }
  }

  adapter.tables[rawTable.name] = sqliteTable(rawTable.name, columns as any)
}
```

## Key Differences from PostgreSQL

| Feature | PostgreSQL | SQLite |
|---------|------------|--------|
| Serial/auto | `serial()` | `integer().autoincrement()` |
| Real numbers | `customType({ dataType: 'real' })` | `real()` |
| UUID | `uuid().defaultRandom()` | `text().$defaultFn(() => uuidv4())` |
| Enums | `pgSchema.enum()` | `text({ enum: [...] })` |
| JSON | `jsonb()` | `text({ mode: 'json' })` |
| Timestamps | `timestamp()` with precision/tz | `text()` with ISO string |
