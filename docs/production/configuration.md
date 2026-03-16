# Configuration

Learn how to configure @deessejs/collections.

## defineConfig

The main function to configure collections:

```typescript
import { defineConfig } from '@deessejs/collections'

const config = defineConfig({
  database: /* adapter */,
  collections: [/* collections */],
  auth: /* auth config */,
  plugins: [/* plugins */]
})
```

## Database Adapter

### PostgreSQL

```typescript
import { pgAdapter } from '@deessejs/collections'

const config = defineConfig({
  database: pgAdapter({
    url: process.env.DATABASE_URL!
  })
})
```

### SQLite

```typescript
import { sqliteAdapter } from '@deessejs/collections'

const config = defineConfig({
  database: sqliteAdapter({
    url: './data.db'
  })
})
```

## Collections

```typescript
import { collection, field, f } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  name: 'Posts',
  fields: {
    title: field({ fieldType: f.text() })
  }
})

const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts]
})
```

## Auth

```typescript
const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  auth: defineAuth({
    emailAndPassword: { enabled: true },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!
      }
    },
    user: {
      fields: {
        role: field({
          fieldType: f.select(['user', 'admin']),
          required: false,
          defaultValue: 'user'
        })
      }
    }
  })
})
```

## Return Value

`defineConfig` returns:

```typescript
const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts]
})

// Collections metadata (read-only)
config.collections.posts.slug     // 'posts'
config.collections.posts.fields   // { title: FieldDefinition }

// Database operations
config.db.posts.find()
config.db.posts.create()
config.db.posts.update()
config.db.posts.delete()

// Auth (if configured)
config.auth.api.getSession()

// Handlers for API routes (Next.js/Hono)
config.handlers  // { GET, POST, PUT, PATCH, DELETE }

// Raw Drizzle instance
config.db.$raw
```

## Environment Variables

```bash
# .env
DATABASE_URL=postgres://user:pass@localhost:5432/db
```

## Validation Options

```typescript
const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  validation: {
    stripUnknown: true,
    coerceTypes: true
  }
})
```

## Complete Example

```typescript
// lib/config.ts
import { defineConfig, collection, field, f, pgAdapter, defineAuth } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean(), defaultValue: false }),
    author: field({ fieldType: f.relation({ to: 'users' }) })
  }
})

const comments = collection({
  slug: 'comments',
  fields: {
    content: field({ fieldType: f.text() }),
    postId: field({ fieldType: f.relation({ to: 'posts' }) }),
    author: field({ fieldType: f.relation({ to: 'users' }) })
  }
})

export const config = defineConfig({
  database: pgAdapter({
    url: process.env.DATABASE_URL!
  }),
  collections: [posts, comments],
  auth: defineAuth({
    emailAndPassword: { enabled: true },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!
      }
    },
    user: {
      fields: {
        role: field({
          fieldType: f.select(['user', 'admin']),
          required: false,
          defaultValue: 'user'
        }),
        avatar: field({
          fieldType: f.text(),
          required: false
        })
      }
    }
  })
})
```

## Summary

| Option | Description |
|--------|-------------|
| `database` | Database adapter (pg, sqlite) |
| `collections` | Array of collections |
| `auth` | Auth configuration |
| `plugins` | Additional plugins |
| `validation` | Validation options |
