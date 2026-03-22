# CLI & Schema Generation

Learn how @deessejs/collections handles database schema generation without drizzle.config.ts or schema files.

## Overview

Collections generates and pushes database schema automatically from your collections definition. No configuration files required.

## Philosophy

- **No drizzle.config.ts** - Schema is derived from collections
- **No schema.ts files** - Collections define the schema
- **Push only** - Simple one-command workflow
- **Runtime generation** - Schema built in memory at runtime

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  @deessejs/collections-cli                    │
├─────────────────────────────────────────────────────────────┤
│  npx @deessejs/collections-cli push                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Load Config                                            │
│     - Import src/lib/collections.ts                         │
│     - Extract collections and fields                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Generate Schema (Runtime)                               │
│     - Build Drizzle schema from collections                 │
│     - Include auth tables if configured                     │
│     - Include plugin tables if configured                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Database Introspection                                  │
│     - Connect to database                                    │
│     - Read existing tables                                  │
│     - Compare with generated schema                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Push Changes                                            │
│     - Generate SQL statements                                │
│     - Execute changes                                       │
│     - Show diff                                             │
└─────────────────────────────────────────────────────────────┘
```

## Usage

```bash
# Push schema to database
npx @deessejs/collections-cli push

# With custom config path
npx @deessejs/collections-cli push --config path/to/config.ts
```

## How It Works

### 1. Config Loading

The CLI imports your collections config dynamically:

```typescript
// src/lib/collections.ts
import { defineConfig, collection, field, f } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  }
})

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts]
})
```

### 2. Schema Generation

At runtime, the CLI:

1. Extracts collections from the config
2. Builds Drizzle table definitions from field types
3. Merges with auth tables if auth is configured
4. Creates in-memory schema

```typescript
// Internal schema generation
const schema = buildSchema(collections)
```

### 3. Introspection & Comparison

Using Drizzle's introspection:

```typescript
// Compare generated schema with existing DB
const currentSchema = await introspect(db)
const diff = compare(schema, currentSchema)
```

### 4. Push

Execute the changes:

```typescript
for (const statement of diff.statements) {
  await db.query(statement)
}
```

## No Configuration Files

Unlike Drizzle Kit, there's no need for:

- `drizzle.config.ts`
- `schema.ts`
- `drizzle-kit` specific configuration

The CLI derives everything from your collections config.

## Comparison

| Feature | Drizzle Kit | Collections CLI |
|---------|-------------|-----------------|
| Config file | drizzle.config.ts | None |
| Schema file | schema.ts | None |
| Commands | generate, migrate, push | push only |
| Config location | Separate file | In your app |

## Example Workflow

### Before

```bash
# No database exists
```

### Define Collections

```typescript
// src/lib/collections.ts
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  }
})

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts]
})
```

### Push Schema

```bash
npx @deessejs/collections-cli push
```

Output:
```
✓ Connected to database
✓ Generated schema from collections
✓ Introspected database
✓ Changes to apply:
  - CREATE TABLE posts (id, title, published, created_at, updated_at)
  ✓ Applied 1 change
```

### Add Field

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),  // NEW
    published: field({ fieldType: f.boolean() })
  }
})
```

### Push Again

```bash
npx @deessejs/collections-cli push
```

Output:
```
✓ Connected to database
✓ Generated schema from collections
✓ Introspected database
✓ Changes to apply:
  - ALTER TABLE posts ADD COLUMN content text
  ✓ Applied 1 change
```

## Auth Tables

When auth is configured, auth tables are automatically included:

```typescript
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  auth: {
    emailAndPassword: { enabled: true }
  }
})
```

The CLI will create:
- `users` (from auth)
- `sessions` (from auth)
- `accounts` (from auth)
- `verifications` (from auth)
- `posts` (from collections)

## Plugin Tables

When plugins add tables (e.g., organization plugin), those are also included automatically.

## Database Support

The CLI supports multiple databases:

- PostgreSQL (via pg driver)
- SQLite (via better-sqlite3)
- MySQL (via mysql2)

Each database driver handles:
- Connection
- Introspection
- SQL generation
- Statement execution

## Summary

| Step | Action |
|------|--------|
| 1 | CLI imports your collections config |
| 2 | Generates Drizzle schema in memory |
| 3 | Introspects existing database |
| 4 | Compares and generates SQL |
| 5 | Executes changes |

No configuration files needed - just collections.

## Next.js Integration

For Next.js, see [Next.js Integration](./nextjs.md) for automatic schema syncing in development.
