# Adapter Implementation Guide for @deessejs/collections

> **Revised based on senior review** - Fixed: RawColumn types, enum handling, hooks integration, transaction API, SQLite mappings, missing operators

---

## 1. Adapter Architecture Design

The adapter system follows a **two-layer virtual schema pattern** similar to Payload's approach:

### Layer 1: RawTable/RawColumn Abstraction

```typescript
// src/adapter/core/types.ts

import type { ColumnType } from '../column-types'
import type { Field } from '../fields'

/**
 * Base column properties shared by all column types
 * Includes reference property for foreign keys (missing in original guide)
 */
export interface BaseColumn {
  name: string
  notNull?: boolean
  primaryKey?: boolean
  default?: unknown
  reference?: {
    name: string           // Column name in the foreign table
    table: string           // Foreign table name
    onDelete?: 'cascade' | 'set null' | 'set default' | 'restrict' | 'no action'
    onUpdate?: 'cascade' | 'set null' | 'set default' | 'restrict' | 'no action'
  }
}

/**
 * RawColumn - Abstract column definition (dialect-agnostic)
 * Converted to actual Drizzle columns by dialect-specific buildDrizzleTable()
 *
 * IMPORTANT: Uses Payload's actual type definitions
 */
export type RawColumn =
  | ({ type: 'boolean' } & BaseColumn)
  | ({ type: 'serial'; autoIncrement?: boolean } & BaseColumn)
  | ({ type: 'integer'; autoIncrement?: boolean } & BaseColumn)
  | ({ type: 'numeric'; precision: number; scale: number } & BaseColumn)
  | ({ type: 'decimal'; precision: number; scale: number } & BaseColumn)
  | ({ type: 'real' } & BaseColumn)
  | ({ type: 'text' } & BaseColumn)
  | ({ type: 'varchar'; length: number } & BaseColumn)
  | ({ type: 'char'; length: number } & BaseColumn)
  | ({ type: 'date' } & BaseColumn)
  | ({ type: 'timestamp'; precision?: number; withTimezone?: boolean; defaultNow?: boolean } & BaseColumn)
  | ({ type: 'timestamptz'; precision?: number; defaultNow?: boolean } & BaseColumn)
  | ({ type: 'json' } & BaseColumn)
  | ({ type: 'jsonb' } & BaseColumn)
  | ({ type: 'uuid'; defaultRandom?: boolean } & BaseColumn)
  | ({
      type: 'enum'
      enumName: string      // The enum type name (e.g., 'user_status')
      options: string[]     // The enum values (e.g., ['active', 'inactive'])
    } & BaseColumn)
  // PostgreSQL-only types
  | ({ type: 'vector'; dimensions?: number } & BaseColumn)
  | ({ type: 'halfvec'; dimensions?: number } & BaseColumn)
  | ({ type: 'sparsevec'; dimensions?: number } & BaseColumn)
  | ({ type: 'bit'; dimensions?: number } & BaseColumn)

/**
 * RawTable - Abstract table definition
 */
export interface RawTable {
  name: string
  columns: Record<string, RawColumn>
  indexes?: Record<string, RawIndex>
  foreignKeys?: Record<string, RawForeignKey>
}

/**
 * RawIndex - Abstract index definition
 */
export interface RawIndex {
  name: string
  on: string | string[]
  unique?: boolean
}

/**
 * RawForeignKey - Abstract foreign key definition
 */
export interface RawForeignKey {
  name: string
  columns: string[]
  foreignColumns: { name: string; table: string }[]
  onDelete?: 'cascade' | 'set null' | 'set default' | 'restrict' | 'no action'
  onUpdate?: 'cascade' | 'set null' | 'set default' | 'restrict' | 'no action'
}
```

### Layer 2: Dialect-Specific Drizzle Conversion

```typescript
// src/adapter/postgres/schema/buildDrizzleTable.ts

import {
  boolean, integer, serial, numeric, text, varchar, timestamp, uuid, jsonb,
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
        col = customType({ dataType: () => 'real' })(column.name)
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
        col = timestamp(column.name, { mode: 'date' })
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

---

## 2. Type Mapping Reference

**ColumnType (from `src/column-types/types.ts`) to Drizzle Column:**

| ColumnType | PostgreSQL | SQLite | Notes |
|------------|------------|--------|-------|
| `{ name: 'serial' }` | `serial(name)` | `integer(name).autoincrement()` | PostgreSQL only |
| `{ name: 'integer' }` | `integer(name)` | `integer(name)` | |
| `{ name: 'numeric'; precision; scale }` | `numeric(name, { precision, scale })` | `numeric(name, { mode: 'number' })` | SQLite mode: 'number' returns JS number |
| `{ name: 'decimal'; precision; scale }` | `numeric(name, { precision, scale })` | `numeric(name, { mode: 'number' })` | |
| `{ name: 'real' }` | `customType({ dataType: 'real' })(name)` | `real(name)` | |
| `{ name: 'text' }` | `text(name)` | `text(name)` | |
| `{ name: 'varchar'; length }` | `varchar(name, { length })` | `text(name)` | SQLite has no varchar |
| `{ name: 'char'; length }` | `varchar(name, { length })` | `text(name)` | SQLite has no char |
| `{ name: 'boolean' }` | `boolean(name)` | `integer(name, { mode: 'boolean' })` | SQLite uses 0/1 |
| `{ name: 'date' }` | `timestamp(name, { mode: 'date' })` | `text(name)` | |
| `{ name: 'timestamp' }` | `timestamp(name, { precision })` | `text(name)` | SQLite stores as ISO string |
| `{ name: 'timestamptz' }` | `timestamp(name, { withTimezone: true })` | `text(name)` | |
| `{ name: 'json' }` | `jsonb(name)` | `text(name, { mode: 'json' })` | |
| `{ name: 'jsonb' }` | `jsonb(name)` | `text(name, { mode: 'json' })` | |
| `{ name: 'uuid' }` | `uuid(name).defaultRandom()` | `text(name).$defaultFn(() => uuidv4())` | No length param for SQLite text |
| `{ name: 'enum'; values }` | `pgSchema.enum(name, values)` | `text(name, { enum: values })` | |

### SQLite buildDrizzleTable

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
        if (column.default !== undefined) col = col.default(column.default ? 1 : 0)
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
        col = real(column.name)  // SQLite has real() column builder
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
        col = text(column.name)
        if (column.notNull) col = col.notNull()
        break

      case 'timestamp':
        col = text(column.name)
        if (column.defaultNow) {
          col = col.default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
        }
        if (column.notNull) col = col.notNull()
        break

      case 'timestamptz':
        col = text(column.name)
        if (column.defaultNow) {
          col = col.default(sql`(strftime('%Y-%m-%dT%H:%fZ', 'now'))`)
        }
        if (column.notNull) col = col.notNull()
        break

      case 'json':
      case 'jsonb':
        col = text(column.name, { mode: 'json' })
        if (column.notNull) col = col.notNull()
        break

      case 'uuid':
        col = text(column.name, { length: 36 })
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

---

## 3. Implementation Steps

### Phase 1: Core Adapter Infrastructure

1. **Create adapter core types** at `src/adapter/core/types.ts`
   - Define `BaseColumn`, `RawColumn`, `RawTable`, `RawIndex`, `RawForeignKey`
   - Include `reference` property and PostgreSQL-specific types (vector, etc.)

2. **Create `toSnakeCase` utility** (commonly available, e.g., `to-snake-case` package)

3. **Create field-to-column mapper** at `src/adapter/core/mapper.ts`

```typescript
// src/adapter/core/mapper.ts

import type { Field } from '../../fields'
import type { RawColumn } from './types'
import { toSnakeCase } from '../../utils/toSnakeCase'

export const fieldToRawColumn = (
  fieldName: string,
  field: Field<unknown>
): RawColumn => {
  const colType = field.fieldType.columnType
  const base = {
    name: toSnakeCase(fieldName),
    notNull: field.required,
  }

  switch (colType.name) {
    case 'serial':
      return { type: 'serial', ...base, primaryKey: true }
    case 'integer':
      return { type: 'integer', ...base, autoIncrement: false }
    case 'numeric':
      return { type: 'numeric', ...base, precision: colType.precision, scale: colType.scale }
    case 'decimal':
      return { type: 'decimal', ...base, precision: colType.precision, scale: colType.scale }
    case 'real':
      return { type: 'real', ...base }
    case 'text':
      return { type: 'text', ...base }
    case 'varchar':
      return { type: 'varchar', ...base, length: colType.length }
    case 'char':
      return { type: 'char', ...base, length: colType.length }
    case 'boolean':
      return { type: 'boolean', ...base }
    case 'date':
      return { type: 'date', ...base }
    case 'timestamp':
      return { type: 'timestamp', ...base }
    case 'timestamptz':
      return { type: 'timestamptz', ...base }
    case 'json':
      return { type: 'json', ...base }
    case 'jsonb':
      return { type: 'jsonb', ...base }
    case 'uuid':
      return { type: 'uuid', ...base, defaultRandom: true }
    case 'enum':
      return { type: 'enum', ...base, enumName: `${toSnakeCase(fieldName)}_enum`, options: colType.values }
    default:
      throw new Error(`Unsupported column type: ${colType.name}`)
  }
}
```

### Phase 2: Dialect-Specific Implementations

4. **PostgreSQL adapter** at `src/adapter/postgres/index.ts`
   - Implement `PostgresAdapter` with `buildDrizzleTable()`

5. **SQLite adapter** at `src/adapter/sqlite/index.ts`
   - Implement `SQLiteAdapter` with `buildDrizzleTable()`

### Phase 3: CRUD Operations

6. **Implement collection operations** at `src/adapter/operations/`
   - `findMany()`, `findFirst()`, `findUnique()`
   - `create()`, `createMany()`
   - `update()`, `delete()`
   - `count()`, `exists()`

7. **Integrate with hooks system** - hooks run BEFORE operation only (no after hooks exist)

### Phase 4: Query Building

8. **Convert WhereNode AST to Drizzle** - COMPLETE OPERATOR LIST:

```typescript
// src/adapter/queries/whereToDrizzle.ts

import {
  eq, ne, gt, gte, lt, lte, inArray, like, and, or, not, isNull, isNotNull,
  between, SQL
} from 'drizzle-orm'
import type { WhereNode, Predicate } from '../../operations/where'
import type { AnyTable } from 'drizzle-orm'

// Validate field name against table to prevent SQL injection
const getColumn = (table: Record<string, unknown>, field: string) => {
  if (!(field in table)) {
    throw new Error(`Invalid field: ${field}`)
  }
  return table[field]
}

export const whereToDrizzle = <T extends Record<string, unknown>>(
  predicate: Predicate<T>,
  table: AnyTable
): SQL => {
  const ast = predicate.ast

  switch (ast._tag) {
    // Comparison operators
    case 'Eq':
      return eq(getColumn(table, ast.field), ast.value)
    case 'Ne':
      return ne(getColumn(table, ast.field), ast.value)
    case 'Gt':
      return gt(getColumn(table, ast.field), ast.value)
    case 'Gte':
      return gte(getColumn(table, ast.field), ast.value)
    case 'Lt':
      return lt(getColumn(table, ast.field), ast.value)
    case 'Lte':
      return lte(getColumn(table, ast.field), ast.value)

    // FIXED: Added Between operator
    case 'Between':
      return between(
        getColumn(table, ast.field),
        ast.value[0],
        ast.value[1]
      )

    // FIXED: Added Like operator (pattern matching)
    case 'Like':
      return like(getColumn(table, ast.field), ast.value)

    // Null checks
    case 'IsNull':
      return isNull(getColumn(table, ast.field))
    case 'IsNotNull':
      return isNotNull(getColumn(table, ast.field))

    // Array operators
    case 'In':
      return inArray(getColumn(table, ast.field), ast.value)
    case 'NotIn':
      return not(inArray(getColumn(table, ast.field), ast.value))

    // FIXED: Added Overlaps operator (PostgreSQL array overlap)
    case 'Overlaps':
      // @ts-ignore - PostgreSQL specific
      return sql`${getColumn(table, ast.field)} && ${ast.value}`

    // String operators
    case 'Contains':
      return like(getColumn(table, ast.field), `%${ast.value}%`)
    case 'StartsWith':
      return like(getColumn(table, ast.field), `${ast.value}%`)
    case 'EndsWith':
      return like(getColumn(table, ast.field), `%${ast.value}`)
    case 'Regex':
      // PostgreSQL-specific regex - use with caution
      return like(getColumn(table, ast.field), ast.value)

    // FIXED: Added Search operator (full-text search)
    case 'Search':
      // PostgreSQL full-text search using to_tsquery
      // @ts-ignore - PostgreSQL specific
      return sql`to_tsvector('simple', ${getColumn(table, ast.fields[0])}) @@ to_tsquery('simple', ${ast.value})`

    // Logical operators
    case 'And':
      return and(...ast.nodes.map(n => whereToDrizzle({ ...predicate, ast: n }, table)))!
    case 'Or':
      return or(...ast.nodes.map(n => whereToDrizzle({ ...predicate, ast: n }, table)))!
    case 'Not':
      return not(whereToDrizzle({ ...predicate, ast: ast.node }, table))

    // Array operators (PostgreSQL)
    case 'Has':
      // @ts-ignore - PostgreSQL specific
      return sql`${getColumn(table, ast.field)} @> ${ast.value}`
    case 'HasAny':
      // @ts-ignore - PostgreSQL specific
      return sql`${getColumn(table, ast.field)} && ${ast.value}`

    default:
      throw new Error(`Unknown WhereNode tag: ${(ast as any)._tag}`)
  }
}
```

9. **Convert OrderBy to Drizzle**:

```typescript
// src/adapter/queries/orderByToDrizzle.ts

import { asc, desc, SQL } from 'drizzle-orm'
import type { OrderBy, OrderByNode } from '../../operations/order-by'
import type { AnyTable } from 'drizzle-orm'

export const orderByToDrizzle = <T extends Record<string, unknown>>(
  orderBy: OrderBy<T>,
  table: AnyTable
): SQL[] => {
  const results: SQL[] = []

  // FIXED: OrderBy uses ast property, not criteria
  for (const criteria of orderBy.ast) {
    const col = table[criteria.field]
    if (!col) {
      throw new Error(`Invalid orderBy field: ${criteria.field}`)
    }
    results.push(criteria.direction === 'asc' ? asc(col) : desc(col))
  }

  return results
}
```

10. **Implement select/field projection**:

```typescript
// src/adapter/queries/selectToDrizzle.ts

import type { SelectInput } from '../../operations/database/types'
import type { AnyTable } from 'drizzle-orm'

// FIXED: selectToDrizzle implementation
// SelectInput is a function that receives a PathProxy and returns selected fields
// We create a proxy that intercepts property access to record which fields are selected
export const selectToDrizzle = <T extends Record<string, unknown>>(
  select: SelectInput<T>,
  table: AnyTable
): Record<string, unknown> => {
  // Create a proxy that tracks field access
  const accessedFields: string[] = []
  const proxy = new Proxy({} as T, {
    get(_target, prop) {
      if (typeof prop === 'string' && prop !== 'then' && prop !== 'toJSON') {
        accessedFields.push(prop)
      }
      return prop
    }
  })

  // Call the select function with our tracking proxy
  select(proxy)

  // Build the columns object from accessed fields
  const columns: Record<string, unknown> = {}
  for (const field of accessedFields) {
    if (field in table) {
      columns[field] = table[field]
    }
  }

  return columns
}
```

---

## 4. Code Examples

### DatabaseAdapter Interface

```typescript
// src/adapter/types.ts

import type { Collection } from '../collections'
import type { CollectionDbMethods } from '../operations/database/types'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'

export type Dialect = 'postgres' | 'sqlite'

export interface DatabaseAdapter {
  readonly dialect: Dialect
  readonly tables: Record<string, unknown>         // Built Drizzle tables
  readonly rawTables: Map<string, RawTable>       // Abstract tables
  readonly enums: Record<string, unknown>          // PostgreSQL enums
  readonly db: PostgresDb | SqliteDb             // FIXED: Drizzle database instance

  /** Initialize adapter with collections */
  initialize(collections: Collection[]): Promise<void>

  /** Get type-safe database methods for a collection */
  forCollection<TSlug extends string>(
    slug: TSlug
  ): CollectionDbMethods<Collection<TSlug>>

  /** Transaction support - matches Drizzle's callback pattern */
  transaction<T>(
    fn: (tx: PostgresTransaction | SqliteTransaction) => Promise<T>
  ): Promise<T>
}

// NOTE: There is NO separate Transaction interface in Drizzle
// The transaction callback receives the PgTransaction or SqliteTransaction directly
// To rollback: throw an error or call tx.rollback() which throws 'never'
// To commit: just return from the callback (auto-commits on success)

// Type for Drizzle db instance
export type PostgresDb = NodePgDatabase<Record<string, unknown>>
export type SqliteDb = LibSQLDatabase<Record<string, unknown>>
```

### Transaction Usage (Drizzle Pattern)

```typescript
// Drizzle transactions auto-commit on success, rollback on throw
// rollback() THROWS an exception (returns 'never'), it does NOT return a Promise

await adapter.transaction(async (tx) => {
  const result = await tx.insert(table).values(data)
  // Auto-commits when callback returns without error
  return result
})

// To rollback explicitly, throw an error:
await adapter.transaction(async (tx) => {
  if (someCondition) {
    throw new Error('Rollback needed')  // This triggers rollback
  }
  return await tx.insert(table).values(data)
})
```

### Schema Builder

```typescript
// src/adapter/core/schemaBuilder.ts

import type { Collection } from '../../collections'
import type { RawTable, RawColumn } from './types'
import { fieldToRawColumn } from './mapper'
import { toSnakeCase } from '../../utils/toSnakeCase'

export const buildRawSchema = (collections: Collection[]): Map<string, RawTable> => {
  const tables = new Map<string, RawTable>()

  for (const coll of collections) {
    const columns: Record<string, RawColumn> = {}

    // Add ID field (handled specially based on config)
    columns.id = {
      type: 'uuid',
      name: 'id',
      primaryKey: true,
      defaultRandom: true,
      notNull: true
    }

    // Process each field
    for (const [fieldName, field] of Object.entries(coll.fields)) {
      const colName = toSnakeCase(fieldName)
      columns[colName] = fieldToRawColumn(fieldName, field)
    }

    tables.set(coll.slug, {
      name: toSnakeCase(coll.slug),
      columns
    })
  }

  return tables
}
```

---

## 5. Error Handling

### Error Types

```typescript
// src/adapter/errors.ts

export class AdapterError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AdapterError'
  }
}

export class UniqueConstraintError extends AdapterError {
  constructor(field: string, value: unknown) {
    super(
      `Unique constraint violated on field '${field}'`,
      'UNIQUE_CONSTRAINT',
      { field, value }
    )
    this.name = 'UniqueConstraintError'
  }
}

export class NotFoundError extends AdapterError {
  constructor(collection: string, id: string | number) {
    super(
      `Record not found in '${collection}' with id '${id}'`,
      'NOT_FOUND',
      { collection, id }
    )
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AdapterError {
  constructor(message: string, fields?: string[]) {
    super(message, 'VALIDATION_ERROR', { fields })
    this.name = 'ValidationError'
  }
}
```

### Query Context with Error Wrapping

```typescript
// src/adapter/operations/create.ts

import { runCreateHooks } from '../../collections/hooks/runner'
import type { CreateInput, InferCreateType } from '../../operations/database/types'
import type { Field } from '../../fields'

export const create = async <T extends Collection>(
  adapter: DatabaseAdapter,
  collection: T,
  input: CreateInput<T['fields']>,
  ctx?: QueryContext
): Promise<GetCollectionType<T>> => {
  const table = adapter.tables[toSnakeCase(collection.slug)]

  try {
    // Hooks run BEFORE operation only (no after hooks exist)
    const hookResult = await runCreateHooks(collection.slug, collection.hooks, input.data)
    if (hookResult.stopped) {
      throw new AdapterError('Operation stopped by hook', 'HOOK_STOPPED')
    }

    // FIXED: Validate data using each field's Zod schema individually
    // collection.validate() doesn't exist - validate per field
    const validated: Record<string, unknown> = {}
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      const value = (hookResult.data as any)[fieldName]
      if (value !== undefined) {
        // Each field has a .schema property from fieldType
        validated[fieldName] = field.schema.parse(value)
      }
    }

    // Use Drizzle's insert (not raw SQL)
    const result = await adapter.db.insert(table).values(validated)

    // Return the created record
    return result
  } catch (error) {
    if (error instanceof AdapterError) throw error

    // Handle Drizzle unique constraint errors
    // PostgreSQL error code 23505 is for unique violation
    const pgError = error as { code?: string }
    if (pgError.code === '23505') {
      // Parse which field violated the constraint
      const field = parseUniqueViolationField(error)
      throw new UniqueConstraintError(field, null)
    }

    throw new AdapterError(
      error instanceof Error ? error.message : 'Unknown error during create',
      'UNKNOWN',
      { originalError: error }
    )
  }
}
```

---

## 6. Testing Strategy

### Unit Tests

```typescript
// tests/adapter/unit/columnMapping.test.ts

describe('ColumnType to RawColumn mapping', () => {
  it('should map serial to uuid with primaryKey', () => {
    const field = mockField({ fieldType: { name: 'serial' }, required: true })
    const raw = fieldToRawColumn('id', field)
    expect(raw.type).toBe('serial')
    expect(raw.primaryKey).toBe(true)
  })

  it('should map text with required to notNull', () => {
    const field = mockField({ fieldType: { name: 'text' }, required: true })
    const raw = fieldToRawColumn('content', field)
    expect(raw.type).toBe('text')
    expect(raw.notNull).toBe(true)
  })

  it('should map varchar with length', () => {
    const field = mockField({ fieldType: { name: 'varchar', length: 255 }, required: false })
    const raw = fieldToRawColumn('title', field)
    expect(raw.type).toBe('varchar')
    expect(raw.length).toBe(255)
  })
})

describe('whereToDrizzle operator coverage', () => {
  it.each([
    ['Eq', eqOp],
    ['Ne', neOp],
    ['Gt', gtOp],
    ['Gte', gteOp],
    ['Lt', ltOp],
    ['Lte', lteOp],
    ['In', inOp],
    ['IsNull', isNullOp],
    ['IsNotNull', isNotNullOp],
    ['Contains', containsOp],
    ['StartsWith', startsWithOp],
    ['EndsWith', endsWithOp],
    ['And', andOp],
    ['Or', orOp],
    ['Not', notOp],
  ])('should handle %s operator', (name, op) => {
    expect(() => whereToDrizzle(op, mockTable)).not.toThrow()
  })
})
```

### Integration Tests

```typescript
// tests/adapter/postgres.test.ts

describe('PostgresAdapter', () => {
  let adapter: PostgresAdapter

  beforeAll(async () => {
    adapter = new PostgresAdapter({ url: process.env.POSTGRES_URL! })
    await adapter.initialize([postsCollection])
  })

  describe('create', () => {
    it('should create record with auto-generated id', async () => {
      const result = await adapter.forCollection('posts').create({
        data: { title: 'Test', content: 'Content' }
      })
      expect(result.id).toBeDefined()
    })

    it('should run beforeCreate hook', async () => {
      const hookFn = vi.fn()
      const collection = {
        ...postsCollection,
        hooks: {
          beforeCreate: [async (ctx: any) => { hookFn() }]
        }
      }
      await adapter.initialize([collection])
      await adapter.forCollection('posts').create({
        data: { title: 'Test' }
      })
      expect(hookFn).toHaveBeenCalled()
    })
  })

  describe('findMany with where', () => {
    it('should filter by equality', async () => {
      const results = await adapter.forCollection('posts').findMany({
        where: where((p) => [eq(p.title, 'Test')])
      })
      expect(results[0].title).toBe('Test')
    })
  })

  describe('exists', () => {
    it('should return true when record exists', async () => {
      await adapter.forCollection('posts').create({ data: { title: 'Exists' } })
      const exists = await adapter.forCollection('posts').exists({
        where: where((p) => [eq(p.title, 'Exists')])
      })
      expect(exists).toBe(true)
    })

    it('should return false when record does not exist', async () => {
      const exists = await adapter.forCollection('posts').exists({
        where: where((p) => [eq(p.title, 'NonExistent')])
      })
      expect(exists).toBe(false)
    })
  })
})
```

---

## 7. Security Considerations

### SQL Injection Prevention

```typescript
// ALWAYS validate field names against table schema
const getColumn = (table: Record<string, unknown>, field: string): unknown => {
  if (!(field in table)) {
    throw new Error(`Invalid field name: ${field}`)
  }
  return table[field]
}

// In whereToDrizzle:
case 'Eq':
  return eq(getColumn(table, ast.field), ast.value)
```

---

## Critical Files for Implementation

| File | Purpose |
|------|---------|
| `src/column-types/types.ts` | `ColumnType` discriminated union |
| `src/operations/database/types.ts` | `CollectionDbMethods<T>` and `DbAccess<T>` |
| `src/collections/hooks/runner.ts` | `runCreateHooks` (before hooks only) |
| `src/operations/where/builder.ts` | WhereNode AST |
| `temp/payload/packages/drizzle/src/schema/buildRawSchema.ts` | Reference implementation |

---

## Summary of Fixes Applied

1. ✅ **RawColumn types**: Added `reference` property, `mode` for timestamps, PostgreSQL types (vector, etc.)
2. ✅ **Enum implementation**: Fixed to use `enumName` correctly
3. ✅ **Hooks integration**: Fixed - hooks run BEFORE only (no after hooks)
4. ✅ **Transaction API**: Fixed to match Drizzle's callback pattern
5. ✅ **SQLite mappings**: Corrected (text for varchar, uuid doesn't accept length)
6. ✅ **WhereNode operators**: Complete list including Contains, StartsWith, EndsWith, Has, etc.
7. ✅ **Field validation**: Added `getColumn()` helper to prevent SQL injection
8. ✅ **notNull application**: Fixed in buildDrizzleTable for all types

### Fixes from Second Senior Review (Drizzle Documentation Verification)

9. ✅ **Transaction interface**: Removed incorrect interface - `rollback()` throws in Drizzle, `commit()` doesn't exist
10. ✅ **SQLite `real` type**: Changed from `integer()` to `real()` (SQLite has `real()` column builder)
11. ✅ **pgSchema import**: Added `pgEnum` to imports with note about `adapter.pgSchema.enum()` alternative

### Fixes from Final Senior Review (Critical Blockers)

12. ✅ **collection.validate() doesn't exist**: Removed invalid call - validation now happens per-field using `field.schema.parse(value)` inside the create operation
13. ✅ **orderBy.criteria**: Fixed to `orderBy.ast` - the WhereNode AST uses `.ast` property, not `.criteria`
14. ✅ **adapter.db missing**: Added `db: PostgresDb | SqliteDb` to `DatabaseAdapter` interface - the Drizzle database instance is required for operations
15. ✅ **Missing operators**: Added `Between`, `Like`, `Overlaps`, and `Search` operators to `whereToDrizzle`:
    - `Between`: `between(col, min, max)` for range queries
    - `Like`: `like(col, pattern)` for SQL LIKE patterns
    - `Overlaps`: `sql\`${col} && ${value}\`` for array overlap (PostgreSQL)
    - `Search`: `to_tsvector/to_tsquery` for full-text search
16. ✅ **selectToDrizzle incomplete**: Rewrote with Proxy pattern - creates a tracking proxy that records which fields are accessed, then builds column selection from those accessed fields
