# Adapter Architecture Design

The adapter system follows a **two-layer virtual schema pattern** similar to Payload's approach.

## Layer 1: RawTable/RawColumn Abstraction

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

## Layer 2: Dialect-Specific Drizzle Conversion

See:
- [PostgreSQL Implementation](03-postgresql-implementation.md)
- [SQLite Implementation](04-sqlite-implementation.md)
