# Provider Architecture

This document describes the functional, provider-based architecture that removes all coupling between Collections core and specific database implementations.

## Core Principle

Collections is **purely a DSL (Domain-Specific Language)** for defining data models. All database-specific logic lives in **providers** that implement a defined interface. The core knows nothing about databases—it only knows about collections, fields, and operations.

```
┌─────────────────────────────────────────────────────────────┐
│                     User Code                               │
├─────────────────────────────────────────────────────────────┤
│  defineCollection({                                         │
│    slug: 'posts',                                           │
│    fields: {                                                │
│      title: { kind: 'text' },                               │
│      published: { kind: 'boolean' }                         │
│    }                                                        │
│  })                                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Collections Core                          │
├─────────────────────────────────────────────────────────────┤
│  - Collection type definitions                              │
│  - Field type definitions                                   │
│  - Hooks definitions                                        │
│  - Operation type inference                                  │
│  - NO database logic                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Provider Interface                         │
├─────────────────────────────────────────────────────────────┤
│  createTable(collection) → Query                            │
│  buildFind(collection, query) → QueryBuilder                │
│  buildCreate(collection, data) → QueryBuilder                │
│  execute(query) → Result                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Provider Implementation                    │
├─────────────────────────────────────────────────────────────┤
│  pgProvider(config)    → DatabaseProvider<'pg'>             │
│  mysqlProvider(config) → DatabaseProvider<'mysql'>          │
│  sqliteProvider(config) → DatabaseProvider<'sqlite'>       │
│                                                              │
│  [Each uses its own Drizzle instance internally]            │
└─────────────────────────────────────────────────────────────┘
```

## Type Definitions

### Provider Types

```typescript
// Supported database providers
type Provider = 'pg' | 'mysql' | 'sqlite'

// Provider configuration
type ProviderConfig =
  | { provider: 'pg'; url: string }
  | { provider: 'mysql'; url: string }
  | { provider: 'sqlite'; url: string }
```

### Field Types

```typescript
// Core field type definitions (database-agnostic)
type FieldKind =
  | 'text'
  | 'number'
  | 'boolean'
  | 'uuid'
  | 'timestamp'
  | 'date'
  | 'json'
  | 'enum'
  | 'array'
  | 'relation'
  | 'custom'

// Field definition
type FieldDefinition<TKind extends FieldKind = FieldKind> = {
  kind: TKind
  required?: boolean
  default?: unknown
  unique?: boolean
  indexed?: boolean
} & (
  TKind extends 'text' ? { maxLength?: number } :
  TKind extends 'number' ? { integer?: boolean; precision?: number; scale?: number } :
  TKind extends 'uuid' ? { autoGenerate?: boolean } :
  TKind extends 'timestamp' | 'date' ? { precision?: number; timezone?: boolean } :
  TKind extends 'enum' ? { values: readonly [string, ...string[]] } :
  TKind extends 'array' ? { items: FieldDefinition } :
  TKind extends 'relation' ? { target: string; type: 'one-to-one' | 'one-to-many' | 'many-to-many'; through?: string } :
  TKind extends 'custom' ? { validate: unknown; serialize: (value: unknown) => unknown } :
  {}
)

// Field options (common to all types)
type FieldOptions = {
  required?: boolean
  default?: unknown
  unique?: boolean
  indexed?: boolean
  label?: string
  description?: string
}
```

### Collection Definition

```typescript
// Collection definition (user-facing DSL)
type CollectionConfig<
  TSlug extends string,
  TFields extends Record<string, FieldDefinition>
> = {
  slug: TSlug
  fields: TFields
  hooks?: HooksConfig<TFields>
  indexes?: IndexConfig[]
  relations?: RelationConfig[]
}

// Hooks configuration
type HooksConfig<TFields extends Record<string, FieldDefinition>> = {
  beforeCreate?: (data: TransformInput<TFields>) => Promise<TransformInput<TFields>> | TransformInput<TFields>
  afterCreate?: (result: TransformOutput<TFields>) => Promise<void> | void
  beforeUpdate?: (data: TransformInput<TFields>, current: TransformOutput<TFields>) => Promise<TransformInput<TFields>> | TransformInput<TFields>
  afterUpdate?: (result: TransformOutput<TFields>) => Promise<void> | void
  beforeDelete?: (current: TransformOutput<TFields>) => Promise<void> | void
  afterDelete?: () => Promise<void> | void
  beforeRead?: (result: TransformOutput<TFields>) => Promise<TransformOutput<TFields>> | TransformOutput<TFields>
  afterRead?: (result: TransformOutput<TFields>) => Promise<TransformOutput<TFields>> | TransformOutput<TFields>
}
```

### Operation Types

```typescript
// Query parameters
type QueryParams = {
  where?: WhereCondition[]
  orderBy?: OrderBy[]
  limit?: number
  offset?: number
  include?: IncludeRelation[]
}

type WhereCondition = {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'notIn' | 'isNull' | 'isNotNull'
  value: unknown
}

type OrderBy = {
  field: string
  direction: 'asc' | 'desc'
}

type IncludeRelation = {
  field: string
  query?: QueryParams
}

// Operation result types
type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error }
```

## Provider Interface

The provider interface is a **function** that returns an object with all database operations. No classes—only functions.

```typescript
// The complete provider interface
type DatabaseProvider<TProvider extends Provider = Provider> = {
  // === Connection ===

  connect: () => Promise<void>
  disconnect: () => Promise<void>
  isConnected: () => boolean

  // === Schema ===

  createTable: (
    collection: CollectionConfig<string, Record<string, FieldDefinition>>
  ) => Promise<TableCreationResult>

  dropTable: (tableName: string) => Promise<void>

  migrate: (collections: CollectionConfig<string, Record<string, FieldDefinition>>[]) => Promise<MigrationResult>

  // === Query Building ===

  buildFind: (
    collection: CollectionConfig<string, Record<string, FieldDefinition>>,
    params: QueryParams
  ) => QueryBuilder

  buildFindOne: (
    collection: CollectionConfig<string, Record<string, FieldDefinition>>,
    id: string
  ) => QueryBuilder

  buildCreate: (
    collection: CollectionConfig<string, Record<string, FieldDefinition>>,
    data: Record<string, unknown>
  ) => QueryBuilder

  buildUpdate: (
    collection: CollectionConfig<string, Record<string, FieldDefinition>>,
    id: string,
    data: Record<string, unknown>
  ) => QueryBuilder

  buildDelete: (
    collection: CollectionConfig<string, Record<string, FieldDefinition>>,
    id: string
  ) => QueryBuilder

  buildCount: (
    collection: CollectionConfig<string, Record<string, FieldDefinition>>,
    params?: Pick<QueryParams, 'where'>
  ) => QueryBuilder

  // === Execution ===

  execute: <T>(queryBuilder: QueryBuilder) => Promise<T>

  // === Provider Info ===

  provider: TProvider
  dialect: string
  supports: ProviderCapabilities
}

// Query builder returned by build* functions
type QueryBuilder = {
  toSQL: () => string
  // Provider-specific query object (e.g., Drizzle's SelectQueryBuilder)
}

// Provider capabilities
type ProviderCapabilities = {
  uuid: 'native' | 'varchar' | 'text'
  json: 'native' | 'text'
  array: boolean
  transaction: boolean
  fullTextSearch: boolean
  joins: boolean
}
```

## Provider Factory Functions

Each provider is a **factory function** that accepts configuration and returns a provider instance.

```typescript
// === PostgreSQL Provider ===

type PostgresConfig = {
  url: string
  ssl?: boolean
  maxConnections?: number
}

const postgresProvider: (config: PostgresConfig) => DatabaseProvider<'pg'> = (config) => {
  // Internal Drizzle instance (private to provider)
  const db = drizzle(createPgClient(config))

  return {
    provider: 'pg',
    dialect: 'postgresql',
    supports: {
      uuid: 'native',
      json: 'native',
      array: true,
      transaction: true,
      fullTextSearch: true,
      joins: true
    },

    connect: async () => { /* ... */ },
    disconnect: async () => { /* ... */ },
    isConnected: () => { /* ... */ },

    createTable: (collection) => pgCreateTable(db, collection),
    dropTable: (name) => db.execute(sql`drop table if exists ${name}`),
    migrate: (collections) => pgMigrate(db, collections),

    buildFind: (collection, params) => pgBuildFind(db, collection, params),
    buildFindOne: (collection, id) => pgBuildFindOne(db, collection, id),
    buildCreate: (collection, data) => pgBuildCreate(db, collection, data),
    buildUpdate: (collection, id, data) => pgBuildUpdate(db, collection, id, data),
    buildDelete: (collection, id) => pgBuildDelete(db, collection, id),
    buildCount: (collection, params) => pgBuildCount(db, collection, params),

    execute: async (builder) => { /* execute and return */ }
  }
}

// === MySQL Provider ===

type MysqlConfig = {
  url: string
}

const mysqlProvider: (config: MysqlConfig) => DatabaseProvider<'mysql'> = (config) => {
  const db = drizzle(createMysqlClient(config))

  return {
    provider: 'mysql',
    dialect: 'mysql',
    supports: {
      uuid: 'varchar',
      json: 'native',
      array: false,
      transaction: true,
      fullTextSearch: true,
      joins: true
    },

    connect: async () => { /* ... */ },
    disconnect: async () => { /* ... */ },
    isConnected: () => { /* ... */ },

    createTable: (collection) => mysqlCreateTable(db, collection),
    dropTable: (name) => db.execute(sql`drop table if exists ${name}`),
    migrate: (collections) => mysqlMigrate(db, collections),

    buildFind: (collection, params) => mysqlBuildFind(db, collection, params),
    buildFindOne: (collection, id) => mysqlBuildFindOne(db, collection, id),
    buildCreate: (collection, data) => mysqlBuildCreate(db, collection, data),
    buildUpdate: (collection, id, data) => mysqlBuildUpdate(db, collection, id, data),
    buildDelete: (collection, id) => mysqlBuildDelete(db, collection, id),
    buildCount: (collection, params) => mysqlBuildCount(db, collection, params),

    execute: async (builder) => { /* execute and return */ }
  }
}

// === SQLite Provider ===

type SqliteConfig = {
  url: string | ':memory:'
}

const sqliteProvider: (config: SqliteConfig) => DatabaseProvider<'sqlite'> = (config) => {
  const db = drizzle(createSqliteClient(config))

  return {
    provider: 'sqlite',
    dialect: 'sqlite',
    supports: {
      uuid: 'text',
      json: 'text',
      array: false,
      transaction: true,
      fullTextSearch: 'limited',
      joins: true
    },

    connect: async () => { /* ... */ },
    disconnect: async () => { /* ... */ },
    isConnected: () => { /* ... */ },

    createTable: (collection) => sqliteCreateTable(db, collection),
    dropTable: (name) => db.execute(sql`drop table if exists ${name}`),
    migrate: (collections) => sqliteMigrate(db, collections),

    buildFind: (collection, params) => sqliteBuildFind(db, collection, params),
    buildFindOne: (collection, id) => sqliteBuildFindOne(db, collection, id),
    buildCreate: (collection, data) => sqliteBuildCreate(db, collection, data),
    buildUpdate: (collection, id, data) => sqliteBuildUpdate(db, collection, id, data),
    buildDelete: (collection, id) => sqliteBuildDelete(db, collection, id),
    buildCount: (collection, params) => sqliteBuildCount(db, collection, params),

    execute: async (builder) => { /* execute and return */ }
  }
}
```

## User Code Example

```typescript
// === Define Collections (Pure DSL) ===

const users = defineCollection({
  slug: 'users',
  fields: {
    id: { kind: 'uuid', autoGenerate: true },
    email: { kind: 'text', maxLength: 255 },
    name: { kind: 'text', maxLength: 100 },
    role: { kind: 'enum', values: ['user', 'admin'] as const },
    createdAt: { kind: 'timestamp', timezone: true, default: 'now' }
  },
  hooks: {
    beforeCreate: async (data) => {
      // Normalize email
      return { ...data, email: data.email.toLowerCase() }
    }
  }
})

const posts = defineCollection({
  slug: 'posts',
  fields: {
    id: { kind: 'uuid', autoGenerate: true },
    title: { kind: 'text', maxLength: 255 },
    content: { kind: 'text' },
    published: { kind: 'boolean', default: false },
    authorId: { kind: 'relation', target: 'users', type: 'one-to-many' },
    createdAt: { kind: 'timestamp', timezone: true, default: 'now' }
  },
  indexes: [
    { fields: ['published', 'createdAt'] }
  ]
})

// === Choose Provider ===

const db = postgresProvider({
  url: process.env.DATABASE_URL!
})

// === Initialize Database ===

await db.connect()
await db.migrate([users, posts])

// === Use Collections ===

// Create
const newPost = await db.execute(
  db.buildCreate(posts, {
    title: 'Hello World',
    content: 'This is my first post',
    authorId: userId
  })
)

// Query
const posts = await db.execute(
  db.buildFind(posts, {
    where: [{ field: 'published', operator: 'eq', value: true }],
    orderBy: [{ field: 'createdAt', direction: 'desc' }],
    limit: 10
  })
)

// Update
const updated = await db.execute(
  db.buildUpdate(posts, postId, {
    published: true
  })
)

// Delete
await db.execute(db.buildDelete(posts, postId))
```

## Benefits of This Architecture

| Benefit | Description |
|---------|-------------|
| **Zero Drizzle coupling** | Core has no Drizzle imports. Providers use Drizzle internally |
| **Swappable providers** | Switch databases by changing one function call |
| **Testable** | Mock providers are simple—just return expected values |
| **Extensible** | Add new providers by implementing the interface |
| **Pure functions** | No classes, no state, easier to reason about |
| **Type-safe** | Full TypeScript inference throughout |
| **Future-proof** | Could swap Drizzle for another ORM without breaking user code |

## Adding a New Provider

To add support for a new database:

```typescript
// Example: Adding Turso (libSQL) support
const tursoProvider: (config: TursoConfig) => DatabaseProvider<'turso'> = (config) => {
  const db = drizzle(createLibSQLClient(config))

  return {
    provider: 'turso',
    dialect: 'sqlite', // libSQL is SQLite-compatible
    supports: {
      uuid: 'text',
      json: 'text',
      array: false,
      transaction: true,
      fullTextSearch: 'limited',
      joins: true
    },

    connect: async () => { /* ... */ },
    disconnect: async () => { /* ... */ },
    isConnected: () => { /* ... */ },

    // ... implement all interface methods
    // Can reuse sqlite implementations since libSQL is compatible
    createTable: (collection) => sqliteCreateTable(db, collection),
    // ...
  }
}
```

## Summary

- **Collections** = Pure DSL for data modeling
- **Providers** = Function that returns database operations
- **No classes** = Only functions and types
- **No coupling** = Core is database-agnostic
- **Swappable** = Change provider without changing collection definitions
