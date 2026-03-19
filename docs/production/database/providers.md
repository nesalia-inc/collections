# Multi-Database Provider System

This document explains how Collections provides a unified DSL (Domain-Specific Language) for defining fields and collections, which is then translated to the appropriate database-specific syntax based on the chosen provider.

## The Problem

Drizzle ORM provides different column types for each database provider. The same logical field can require completely different syntax:

```typescript
// PostgreSQL
import { pgText, pgUuid, pgTimestamp, pgJsonb } from 'drizzle-orm/pg-core'

// MySQL
import { mysqlText, mysqlDatetime, mysqlJson } from 'drizzle-orm/mysql-core'

// SQLite
import { text, integer } from 'drizzle-orm/sqlite-core'
```

This creates a challenge: your field definitions become provider-specific, making it difficult to switch databases or support multiple databases.

## The Solution: Provider Abstraction

Collections introduces a **provider abstraction layer** that allows you to define fields using a unified DSL. The provider translates these definitions to the appropriate database-specific columns.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Collection Code                     │
├─────────────────────────────────────────────────────────────┤
│  fields: {                                                 │
│    title: text(),        // Unified DSL                    │
│    uuid: uuid(),                                          │
│    data: json()                                            │
│  }                                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Collections Provider                     │
├─────────────────────────────────────────────────────────────┤
│  translateField(field, provider)                            │
│                                                              │
│  text()      → pgText() | mysqlText() | text()             │
│  uuid()      → pgUuid() | varchar(36)  | text()            │
│  json()      → pgJsonb() | mysqlJson() | text()            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database-Specific                       │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL    │    MySQL           │    SQLite             │
│  ───────────   │    ─────           │    ──────             │
│  text          │    text            │    text               │
│  uuid          │    varchar(36)     │    text               │
│  jsonb         │    json            │    text               │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Selecting a Provider

```typescript
import { defineConfig } from '@deessejs/collections'
import { pgAdapter, mysqlAdapter, sqliteAdapter } from '@deessejs/collections-drizzle'

// PostgreSQL (default)
export const config = defineConfig({
  database: pgAdapter({ url: process.env.POSTGRES_URL }),
  collections: [posts, users]
})

// MySQL
export const config = defineConfig({
  database: mysqlAdapter({ url: process.env.MYSQL_URL }),
  collections: [posts, users]
})

// SQLite
export const config = defineConfig({
  database: sqliteAdapter({ url: './dev.db' }),
  collections: [posts, users]
})
```

### Database Adapters

Collections provides adapters for each supported database via the `collections-drizzle` package:

```typescript
import {
  pgAdapter,
  mysqlAdapter,
  sqliteAdapter
} from '@deessejs/collections-drizzle'

// PostgreSQL
const db = pgAdapter({
  url: process.env.POSTGRES_URL
})

// MySQL
const db = mysqlAdapter({
  url: process.env.MYSQL_URL
})

// SQLite (file-based)
const db = sqliteAdapter({
  url: './data/dev.db'
})

// SQLite (in-memory)
const db = sqliteAdapter({
  url: ':memory:'
})
```

## Field Types and Providers

### How It Works

Field types in Collections are **provider-agnostic**. They define a **column type** (abstract), and providers translate that to the actual database column.

```
┌─────────────────────────────────────────────────────────────┐
│                    Field Type                                │
│  title: field({ fieldType: f.text() })                     │
│         └─> provides columnType: 'text'                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Provider                                │
│  Reads columnType 'text'                                    │
│  PostgreSQL  → text                                         │
│  MySQL       → text                                         │
│  SQLite     → text                                         │
└─────────────────────────────────────────────────────────────┘
```

### Built-in Field Types

Field types simply declare their column type:

```typescript
export const posts = collection({
  slug: 'posts',

  fields: {
    // Provides columnType: 'text'
    title: field({ fieldType: f.text() }),

    // Provides columnType: 'text' (maxLength is validation)
    slug: field({ fieldType: f.text({ maxLength: 255 }) }),

    // Provides columnType: 'uuid'
    id: field({ fieldType: f.uuid({ autoGenerate: true }) }),

    // Provides columnType: 'timestamp'
    createdAt: field({ fieldType: f.timestamp() }),

    // Provides columnType: 'json'
    metadata: field({ fieldType: f.json() }),

    // Provides columnType: 'number'
    count: field({ fieldType: f.number() })
  }
})
```

The provider is responsible for translating the column type to the appropriate database column.

### Provider-Specific Options

Some options are provider-specific and only apply when supported:

```typescript
export const posts = collection({
  slug: 'posts',

  fields: {
    // timezone option - only applies to PostgreSQL
    createdAt: timestamp({ timezone: true }),

    // precision option - applies to PostgreSQL and MySQL
    updatedAt: timestamp({ precision: 6 }),

    // mode: 'string' - stores as string instead of Date
    // Useful for SQLite which doesn't have native date types
    loggedAt: timestamp({ mode: 'string' }),

    // scale/precision - for decimal types
    price: number({ precision: 10, scale: 2 })
  }
})
```

## Creating Custom Field Types

Fields in Collections are **agnostic by design**. A field simply declares its type using DSL primitives—it has no knowledge of providers or Drizzle. The translation to database-specific columns happens entirely within the provider.

### Field Type Definition

When creating a custom field type, you only specify the DSL-level type:

```typescript
// fields/custom.ts
import { fieldType } from '@deessejs/collections'
import { z } from 'zod'

// Just define the field using DSL primitives
// The provider handles the translation to pgText / mysqlText / text
export const slug = fieldType({
  // Pure DSL type - no Drizzle knowledge
  kind: 'text',

  schema: z.string()
    .regex(/^[a-z0-9-]+$/, 'Must contain only lowercase letters, numbers, and hyphens')
    .min(3)
    .max(100)
})

// Usage - the field just declares its type
const posts = defineCollection({
  slug: 'posts',
  fields: {
    slug: slug()
  }
})
```

### How Provider Translation Works

Field types provide a `columnType` property. Providers read this and translate to database-specific columns:

```typescript
// Field type provides columnType (no provider knowledge)
const textField = field({
  fieldType: f.text()
})
// textField.columnType = 'text'

// Provider reads columnType and maps to database
const pgAdapter = databaseProvider({
  name: 'pg',

  // Provider reads columnType from field definition
  createTable: (name, columns) => {
    const colDefs = columns.map(col => {
      const type = this.types[col.columnType] // 'text' → 'text'
      return `${col.name} ${type}`
    })
    return `CREATE TABLE ${name} (${colDefs.join(', ')})`
  },

  types: {
    text: 'text',
    uuid: 'uuid',
    json: 'jsonb',
    timestamp: 'timestamptz'
  }
})
```

This separation ensures:
- **Fields are pure DSL** - no provider logic in field definitions
- **Providers handle translation** - each provider maps columnType to database types
- **Easy to add new providers** - just implement the mapping

## Provider Detection

Collections automatically detects the provider from your database adapter:

```typescript
import { defineConfig, type Provider } from '@deessejs/collections'

export const config = defineConfig({
  // provider is automatically detected as 'pg'
  database: pgAdapter({ url: process.env.POSTGRES_URL }),
  collections: [posts]
})

// Access provider in hooks if needed
export const posts = collection({
  slug: 'posts',

  hooks: {
    beforeCreate: {
      handler: async ({ data, context }) => {
        // context.provider is 'pg' | 'mysql' | 'sqlite'
        const provider = context.provider

        if (provider === 'pg') {
          // PostgreSQL-specific logic
        }
      }
    }
  }
})
```

## Type Inference Across Providers

TypeScript inference works consistently regardless of provider:

```typescript
export const posts = collection({
  slug: 'posts',

  fields: {
    id: uuid(),        // string (UUID)
    title: text(),     // string
    count: number(),  // number
    metadata: json()  // unknown (or your schema type)
  }
})

// TypeScript type is the same for all providers
type Post = GetCollectionType<typeof posts>
// type Post = {
//   id: string
//   title: string
//   count: number
//   metadata: unknown
//   createdAt: Date
//   updatedAt: Date
// }
```

## Migrating Between Providers

Since collections provides a unified DSL, migrating between databases is straightforward:

1. **Change the adapter** in your config
2. **Update connection string**
3. **Run migrations** (Drizzle handles the rest)

```typescript
// Before: PostgreSQL
export const config = defineConfig({
  database: pgAdapter({ url: process.env.POSTGRES_URL }),
  collections: [posts]
})

// After: MySQL (just change the adapter)
export const config = defineConfig({
  database: mysqlAdapter({ url: process.env.MYSQL_URL }),
  collections: [posts]
})
```

### Known Limitations

Some features are provider-specific:

| Feature | PostgreSQL | MySQL | SQLite |
|---------|------------|-------|--------|
| Native UUID | ✓ | ✗ (varchar) | ✗ (text) |
| Native JSON | ✓ (jsonb) | ✓ | ✗ (text) |
| Array types | ✓ | ✗ (JSON) | ✗ (JSON) |
| Full-text search | ✓ | ✓ | Limited |
| Time zones | ✓ | ✗ | N/A |

For provider-specific features, use conditional logic in hooks or field options.

## Summary

| Concept | Description |
|---------|-------------|
| **Provider** | Database backend: `pg`, `mysql`, or `sqlite` |
| **Adapter** | Connection method for each provider |
| **Translation** | Automatic conversion of field types |
| **Provider Context** | Access provider in custom field types |
| **Unified DSL** | Write once, run on any database |

The provider system allows you to write database-agnostic collection definitions while maintaining full access to provider-specific features when needed.

## Dynamic Schema & Next.js Integration

For details on how Collections uses fully dynamic schema (no drizzle.config.ts) and the hot-reload system for Next.js, see [Dynamic Schema](./dynamic-schema.md).

## Creating Custom Providers

Collections provides a **100% dynamic provider system**. You can create custom providers for any database or data source using `databaseProvider`:

```typescript
import { databaseProvider } from '@deessejs/collections'

const myProvider = databaseProvider({
  name: 'my-custom-db',

  // Connection
  connect: async (config) => {
    return {
      query: async (sql, params) => { /* ... */ },
      execute: async (sql, params) => { /* ... */ },
      transaction: async (fn) => { /* ... */ },
    }
  },

  // Schema generation
  createTable: (name, columns) => { /* ... */ },

  // Field type mapping
  types: {
    text: 'text',
    number: 'integer',
    boolean: 'boolean',
    json: 'text',
    uuid: 'varchar(36)',
    timestamp: 'timestamp'
  }
})
```

### Provider Interface

A custom provider must implement:

```typescript
interface DatabaseProvider {
  name: string

  // Connect to the database
  connect: (config: ProviderConfig) => Promise<DatabaseConnection>

  // Create a table definition
  createTable: (name: string, columns: ColumnDefinition[]) => TableDefinition

  // Map field types to database types
  types: Record<FieldKind, string>
}

interface DatabaseConnection {
  query: (sql: string, params?: unknown[]) => Promise<unknown[]>
  execute: (sql: string, params?: unknown[]) => Promise<number>
  transaction: <T>(fn: (tx: Transaction) => Promise<T>) => Promise<T>
}
```

### Example: Custom REST API Provider

```typescript
const restApiProvider = databaseProvider({
  name: 'rest-api',

  connect: async (config) => {
    const baseUrl = config.url

    return {
      query: async (sql, params) => {
        // Convert SQL-like query to REST call
        const response = await fetch(`${baseUrl}/query`, {
          method: 'POST',
          body: JSON.stringify({ sql, params })
        })
        return response.json()
      },

      execute: async (sql, params) => {
        const response = await fetch(`${baseUrl}/execute`, {
          method: 'POST',
          body: JSON.stringify({ sql, params })
        })
        return response.json()
      },

      transaction: async (fn) => {
        // Handle transaction logic
        return fn(mockTx)
      }
    }
  },

  createTable: (name, columns) => {
    return `CREATE TABLE ${name} (${columns.join(', ')})`
  },

  types: {
    text: 'text',
    number: 'numeric',
    boolean: 'boolean',
    json: 'json',
    uuid: 'uuid',
    timestamp: 'timestamptz'
  }
})
```

### Using Custom Providers

```typescript
const config = defineConfig({
  database: restApiProvider({
    url: 'https://api.example.com'
  }),
  collections: [posts, users]
})
```

### Why Custom Providers?

- **Legacy databases** - Connect to existing databases
- **APIs** - Use REST or GraphQL as data source
- **Testing** - Easy to mock with in-memory providers
- **Specialized backends** - Connect to search engines, etc.

The provider system ensures Collections remains database-agnostic while allowing full customization.
