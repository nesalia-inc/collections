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

Collections provides adapters for each supported database:

```typescript
import {
  pgAdapter,
  mysqlAdapter,
  sqliteAdapter
} from '@deessejs/collections'

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

## Field Type Translation

### Built-in Field Types

Each built-in field type automatically translates based on the provider:

```typescript
// This definition works across all providers
export const posts = collection({
  slug: 'posts',

  fields: {
    // Text - translates to:
    //   PostgreSQL: text
    //   MySQL: text
    //   SQLite: text
    title: text(),

    // Text with length - translates to:
    //   PostgreSQL: varchar(255)
    //   MySQL: varchar(255)
    //   SQLite: text (length ignored)
    slug: text({ max: 255 }),

    // UUID - translates to:
    //   PostgreSQL: uuid with gen_random_uuid() default
    //   MySQL: varchar(36)
    //   SQLite: text (UUID as string)
    id: uuid(),

    // Timestamp - translates to:
    //   PostgreSQL: timestamp with time zone
    //   MySQL: datetime
    //   SQLite: text (ISO string)
    createdAt: timestamp(),

    // JSON - translates to:
    //   PostgreSQL: jsonb
    //   MySQL: json
    //   SQLite: text (JSON stored as string)
    metadata: json(),

    // Number - translates to:
    //   PostgreSQL: integer
    //   MySQL: int
    //   SQLite: integer
    count: number()
  }
})
```

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

## Creating Provider-Aware Field Types

### Using Provider Context

When creating custom field types, you can access the current provider to make decisions:

```typescript
import { fieldType, type Provider } from '@deessejs/collections'

// Access provider in field definition
const customField = fieldType({
  schema: z.string(),

  // The database function receives the provider context
  database: (provider: Provider) => {
    switch (provider) {
      case 'pg':
        return pgText()
      case 'mysql':
        return mysqlText()
      case 'sqlite':
        return text()
    }
  }
})
```

### Complete Example: UUID Field Type

Here's how to create a UUID field that works across all providers:

```typescript
// fields/uuid.ts
import { fieldType, type Provider } from '@deessejs/collections'
import { z } from 'zod'
import { pgUuid, pgText } from 'drizzle-orm/pg-core'
import { mysqlText } from 'drizzle-orm/mysql-core'
import { text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const uuid = fieldType({
  schema: z.string().uuid(),

  // Database column depends on provider
  database: (provider: Provider) => {
    switch (provider) {
      case 'pg':
        // PostgreSQL has native UUID with auto-generation
        return pgUuid().defaultRandom()

      case 'mysql':
        // MySQL uses VARCHAR(36) for UUID
        return mysqlText(36)

      case 'sqlite':
        // SQLite uses TEXT
        return text()
    }
  },

  // Some options are provider-specific
  config: {
    // Auto-generate default - only works on PostgreSQL
    autoGenerate: () => ({
      database: (provider: Provider) => {
        if (provider === 'pg') {
          return pgUuid().defaultRandom()
        }
        // For other providers, use application-level generation
        return text() // You'll need to generate UUID in hooks
      }
    })
  }
})
```

### Complete Example: JSON Field Type

```typescript
// fields/json.ts
import { fieldType, type Provider } from '@deessejs/collections'
import { z } from 'zod'
import { pgJsonb } from 'drizzle-orm/pg-core'
import { mysqlJson } from 'drizzle-orm/mysql-core'
import { text } from 'drizzle-orm/sqlite-core'

export const json = <T extends z.ZodType = z.ZodAny>(
  schema?: T
) => fieldType({
  schema: schema || z.any(),

  database: (provider: Provider) => {
    switch (provider) {
      case 'pg':
        return pgJsonb()

      case 'mysql':
        // MySQL JSON handles objects natively
        return mysqlJson()

      case 'sqlite':
        // SQLite stores JSON as text with automatic parsing
        return text()
    }
  }
})
```

### Complete Example: Timestamp Field Type

```typescript
// fields/timestamp.ts
import { fieldType, type Provider } from '@deessejs/collections'
import { z } from 'zod'
import { pgTimestamp, pgTimestampString } from 'drizzle-orm/pg-core'
import { mysqlDatetime, mysqlDatetimeString } from 'drizzle-orm/mysql-core'
import { text } from 'drizzle-orm/sqlite-core'

export const timestamp = fieldType({
  schema: z.date(),

  database: (provider: Provider, options: TimestampOptions = {}) => {
    const { precision = 6, timezone = false, mode = 'date' } = options

    switch (provider) {
      case 'pg':
        if (mode === 'string') {
          return pgTimestampString(precision, timezone)
        }
        return pgTimestamp(precision, timezone)

      case 'mysql':
        if (mode === 'string') {
          return mysqlDatetimeString(precision)
        }
        return mysqlDatetime(precision)

      case 'sqlite':
        // SQLite has no native timestamp - use text
        return text()
    }
  },

  config: {
    defaultNow: () => ({
      database: (provider: Provider, options: TimestampOptions = {}) => {
        // Return column with defaultNow() where supported
        const base = timestamp.database(provider, options)
        if (provider === 'pg') {
          return base.defaultNow()
        }
        // For MySQL/SQLite, handle in hooks
        return base
      }
    })
  }
})

interface TimestampOptions {
  precision?: number
  timezone?: boolean
  mode?: 'date' | 'string'
}
```

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
