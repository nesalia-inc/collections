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

## Options

| Option | Description |
|--------|-------------|
| `database` | Database adapter (pg, sqlite) |
| `collections` | Array of collections |
| `auth` | Auth configuration |
| `plugins` | Additional plugins |
| `validation` | Validation options |

## Documents

- [Database](./database.md) - Database adapters (PostgreSQL, SQLite)
- [Return Value](./return-value.md) - What defineConfig returns
- [Authentication](../authentication.md) - Auth configuration

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
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean(), defaultValue: false }),
    author: field({ fieldType: f.relation({ to: 'users' }) })
  }
})

export const config = defineConfig({
  database: pgAdapter({
    url: process.env.DATABASE_URL!
  }),
  collections: [posts]
})
```