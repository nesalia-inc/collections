# DatabaseAdapter Interface

## Interface Definition

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

// Type for Drizzle db instance
export type PostgresDb = NodePgDatabase<Record<string, unknown>>
export type SqliteDb = LibSQLDatabase<Record<string, unknown>>
```

## Transaction Usage (Drizzle Pattern)

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

## Key Points

1. **No separate Transaction interface** - Drizzle's transaction callback receives the `PgTransaction` or `SqliteTransaction` directly
2. **Rollback via throw** - Call `tx.rollback()` which throws (returns `never`)
3. **Commit is implicit** - Return from the callback without error to auto-commit
4. **db property required** - The Drizzle database instance is needed for CRUD operations
