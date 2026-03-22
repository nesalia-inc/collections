# Provider Configuration

Learn how to configure database providers in Collections.

## Selecting a Provider

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

## Database Adapters

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
