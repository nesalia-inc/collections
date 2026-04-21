# Expected Result: ConfigInput with Migrations Support

## Overview

This document outlines proposed modifications to `ConfigInput` and `Config` to add:
1. Support for raw connection strings (in addition to `DbConnection`)
2. Optional migrations configuration

---

## Proposed Modifications

### 1. `packages/collections/src/config/types.ts`

#### Current State

```typescript
import type { Collection } from '../collections'
import type { DbAccess } from '../operations/database'

export interface ConfigInput<T extends Collection[]> {
  readonly collections: T
}

type CollectionsRecord<T extends Collection[]> = {
  [K in T[number] as K extends Collection<infer S> ? S : never]: K
}

export type Config<T extends Collection[]> = {
  readonly collections: CollectionsRecord<T>
  readonly db: DbAccess<T>
}
```

#### Proposed Changes

```typescript
import type { Collection } from '../collections'
import type { DbAccess } from '../operations/database'
import type { DbConnection } from '../runtime/createCollections'

/**
 * Migrations configuration for database schema migrations
 */
export interface MigrationsConfig {
  /**
   * Directory containing migration files
   * @default './drizzle'
   */
  readonly dir?: string
  /**
   * Name of the migrations tracking table
   * @default '__collections_migrations'
   */
  readonly table?: string
}

/**
 * Database connection input - supports both DbConnection objects and raw connection strings
 * When a string is provided, it will be converted to a DbConnection based on the dialect detected
 */
export type DbConnectionInput = DbConnection | string

export interface ConfigInput<T extends Collection[]> {
  readonly collections: T
  /**
   * Database connection - either a DbConnection object or a raw connection string
   * For raw strings:
   *   - PostgreSQL: 'postgresql://user:pass@host:port/db'
   *   - SQLite: './path/to/database.sqlite'
   */
  readonly db: DbConnectionInput
  /**
   * Optional migrations configuration
   */
  readonly migrations?: MigrationsConfig
}

type CollectionsRecord<T extends Collection[]> = {
  [K in T[number] as K extends Collection<infer S> ? S : never]: K
}

export type Config<T extends Collection[]> = {
  readonly collections: CollectionsRecord<T>
  readonly db: DbAccess<T>
  readonly migrations: MigrationsConfig
}
```

---

### 2. `packages/collections/src/config/builder.ts`

#### Current State

```typescript
import type { Collection } from '../collections'
import type { Config, ConfigInput } from './types'

export const defineConfig = <T extends Collection[]>(input: ConfigInput<T>): Config<T> => {
  const collections = {} as Record<string, Collection>
  for (const collection of input.collections) {
    collections[collection.slug] = collection
  }
  const db = {} as Config<T>['db']
  return { collections, db } as Config<T>
}
```

#### Proposed Changes

```typescript
import type { Collection } from '../collections'
import type { Config, ConfigInput } from './types'
import { postgres, sqlite } from '../runtime/createCollections'

/**
 * Default migrations configuration
 */
const DEFAULT_MIGRATIONS_CONFIG = {
  dir: './drizzle',
  table: '__collections_migrations',
} as const

/**
 * Parses a raw connection string into a DbConnection
 * Detection logic:
 *   - If starts with 'postgresql://' or 'postgres://' -> postgres
 *   - If looks like a file path (contains path separators) or ends with '.sqlite' -> sqlite
 *   - Otherwise -> throws error
 */
const parseConnectionString = (connection: string): DbConnection => {
  if (connection.startsWith('postgresql://') || connection.startsWith('postgres://')) {
    return postgres(connection)
  }
  if (connection.includes('/') || connection.endsWith('.sqlite') || connection.endsWith('.db')) {
    return sqlite(connection)
  }
  throw new Error(`Unable to parse connection string: ${connection}`)
}

export const defineConfig = <T extends Collection[]>(input: ConfigInput<T>): Config<T> => {
  const collections = {} as Record<string, Collection>
  for (const collection of input.collections) {
    collections[collection.slug] = collection
  }

  // Normalize db connection - convert string to DbConnection if needed
  const dbConnection = typeof input.db === 'string' ? parseConnectionString(input.db) : input.db

  // Normalize migrations config with defaults
  const migrations: Config<T>['migrations'] = {
    dir: input.migrations?.dir ?? DEFAULT_MIGRATIONS_CONFIG.dir,
    table: input.migrations?.table ?? DEFAULT_MIGRATIONS_CONFIG.table,
  }

  // Note: The actual db (DbAccess) creation is handled by createCollections
  // defineConfig only prepares the configuration structure
  const db = {} as Config<T>['db']

  return { collections, db, migrations } as Config<T>
}
```

---

## Breaking Changes

### 1. `Config<T>` Type Now Requires `migrations` Property

The `Config<T>` type now includes a required `migrations` property:

```typescript
// Before
export type Config<T extends Collection[]> = {
  readonly collections: CollectionsRecord<T>
  readonly db: DbAccess<T>
}

// After
export type Config<T extends Collection[]> = {
  readonly collections: CollectionsRecord<T>
  readonly db: DbAccess<T>
  readonly migrations: MigrationsConfig  // NEW - required
}
```

**Impact**: Any code that destructures `Config<T>` or uses its type will need to handle the new `migrations` property. This is a **breaking change** for type consumers.

### 2. `defineConfig` Return Type Changes

The return type of `defineConfig` now includes `migrations`, which could break code that explicitly types the result.

### 3. Connection String Support via `DbConnectionInput`

The ability to pass a raw string instead of `DbConnection` is a **non-breaking additive change** to `ConfigInput`, but code that explicitly types `ConfigInput` parameters may need updating.

---

## Open Questions

### 1. Should `migrations` be optional in `Config<T>`?

Currently, `migrations` is required in `Config<T>` to ensure all configs have migration settings. However, if someone is using `createCollections` without needing migrations, they may find this burdensome.

**Options**:
- **A**: Keep `migrations` required in `Config<T>` (current proposal)
- **B**: Make `migrations` optional in `Config<T>` with defaults applied at runtime

### 2. Should we infer defaults from database type?

PostgreSQL and SQLite might need different default migration directories (`./drizzle` vs `./drizzle-sqlite`). Should the defaults be different based on `db.type`?

**Current Proposal**: Use identical defaults for both. Revisit if needed.

### 3. Should we validate the connection string format?

Currently `parseConnectionString` does basic detection. Should we:
- Validate the format more strictly?
- Return a `Result<DbConnection, Error>` instead of throwing?
- Use `@deessejs/fp` patterns (e.g., `Try<DbConnection, Error>`) as per project conventions?

### 4. Where should migration execution logic live?

This document only covers configuration. The actual migration execution (`runMigrations`, `createMigrationsTable`, etc.) is out of scope but needs to be designed:
- Should it be a method on `DbAccess`?
- Should it be a separate function exported from the config module?
- Should it integrate with Drizzle Kit?

### 5. Should the `migrations` config be validated at build time or runtime?

- **Build time (Zod schema)**: Catches errors earlier, adds type safety
- **Runtime**: More flexible, allows environment variable substitution

The project uses Zod validation in other places (e.g., field types). Should we add Zod validation here too?
