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

The provider internally maps DSL types to database-specific columns:

```typescript
// Inside pgAdapter - PostgreSQL implementation
const fieldToColumn = (field: FieldDefinition) => {
  switch (field.kind) {
    case 'text':
      return pgText()
    case 'uuid':
      return pgUuid().defaultRandom()
    case 'json':
      return pgJsonb()
    case 'timestamp':
      return pgTimestamp()
    // ... etc
  }
}

// Inside mysqlAdapter - MySQL implementation
const fieldToColumn = (field: FieldDefinition) => {
  switch (field.kind) {
    case 'text':
      return mysqlText()
    case 'uuid':
      return mysqlText(36) // VARCHAR(36) for UUID
    case 'json':
      return mysqlJson()
    case 'timestamp':
      return mysqlDatetime()
    // ... etc
  }
}
```

This separation ensures:
- **Fields are pure DSL** - no provider logic in field definitions
- **Providers handle translation** - each provider knows how to map DSL types
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

## Dynamic Schema (No drizzle.config.ts)

Collections uses **fully dynamic schema** - no code generation, no config files. Everything happens in-memory at runtime.

### How It Works

```typescript
// No drizzle.config.ts needed!
// Collections creates tables dynamically at runtime

import { defineConfig } from '@deessejs/collections'
import { pgAdapter } from '@deessejs/collections-drizzle'

// 1. Define collections (just code)
const posts = defineCollection({
  slug: 'posts',
  fields: {
    title: { kind: 'text' },
    published: { kind: 'boolean' }
  }
})

// 2. Adapter creates tables dynamically
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL }),
  collections: [posts]
})

// Internally, the adapter:
// - Creates pgTable() objects in memory
// - Maps collection fields to Drizzle columns
// - Registers tables with the Drizzle instance
// - All happens at runtime, no generation
```

### No Code Generation

Traditional Drizzle requires:
- `drizzle.config.ts` for configuration
- Code generation: `drizzle-kit generate`
- Migration files

Collections does **none of this**:
- No config files
- No CLI commands
- Tables created in-memory at startup
- Schema lives in the running process only

### Migration Strategy

For production, you can still generate migrations if needed:

```typescript
// Optional: Generate migration SQL for deployment
const migrationSQL = config.generateMigration()

// Or use Drizzle Kit separately with the generated schema
export const schema = config.getSchema() // Returns Drizzle tables
```

But during development, everything is dynamic.

## Next.js Integration

Collections provides a **dynamic push system** for Next.js that hot-reloads collections when files change.

### withCollections

```typescript
// next.config.js or next.config.mjs
import { withCollections } from '@deessejs/collections/next'

export default withCollections({
  // Your Next.js config
})
```

### How Dynamic Push Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Development                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  collections/posts.ts ──────► File Watcher                  │
│        │                                                    │
│        │ (file change detected)                            │
│        ▼                                                    │
│  collections/reload() ◄───── Parse & Validate              │
│        │                                                    │
│        │ (update runtime schema)                          │
│        ▼                                                    │
│  API Routes updated ──────► Clients notified (optional)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### What Happens on File Change

1. **Watcher detects change** in `collections/` folder
2. **Parse & validate** new collection definitions
3. **Update runtime** - recreate tables in memory
4. **Push to clients** - optional WebSocket notification
5. **API routes updated** - new collections available immediately

### Type Safety at Runtime

The system maintains full TypeScript safety:

```typescript
// types/collections.d.ts (auto-generated, gitignored)
export type CollectionNames = 'posts' | 'users' | 'comments'

export type Post = {
  id: string
  title: string
  published: boolean
  createdAt: Date
}

// Used by client components
import { type Post } from '@/types/collections'
```

### No Restart Needed

Traditional approach:
```
Edit file → Restart dev server → Wait → Continue
```

Collections approach:
```
Edit file → Saved → Hot-reloaded → Continue
```

The `withCollections` wrapper handles everything:
- File watching (using `chokidar` or Next.js's built-in watcher)
- Collection parsing and validation
- Runtime schema updates
- Type generation (background)
- Optional client notifications
