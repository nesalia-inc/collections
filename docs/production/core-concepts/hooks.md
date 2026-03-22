# Hooks

Learn how to use hooks to add lifecycle logic to your collections.

## Overview

Hooks allow you to run code at different points in the lifecycle of a collection operation:

- `beforeOperation` - Runs before any operation
- `beforeCreate` / `afterCreate` - Create lifecycle
- `beforeUpdate` / `afterUpdate` - Update lifecycle
- `beforeDelete` / `afterDelete` - Delete lifecycle
- `beforeRead` / `afterRead` - Read lifecycle

## Defining Hooks

```typescript
import { collection, field, f } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  },
  hooks: {
    beforeCreate: [
      async (context) => {
        console.log('About to create:', context.data)
      }
    ],
    afterCreate: [
      async (context) => {
        console.log('Created:', context.result)
      }
    ]
  }
})
```

## Hook Context

### Create Hook Context

```typescript
{
  collection: 'posts',
  operation: 'create',
  data: { title: 'Hello', content: 'World' },
  result: { id: 1, title: 'Hello', ... },
  db: /* Drizzle instance */
}
```

### Update Hook Context

```typescript
{
  collection: 'posts',
  operation: 'update',
  data: { title: 'New Title' },
  where: { id: 1 },
  previousData: { id: 1, title: 'Hello', ... },
  result: { id: 1, title: 'New Title', ... },
  db: /* Drizzle instance */
}
```

### Delete Hook Context

```typescript
{
  collection: 'posts',
  operation: 'delete',
  where: { id: 1 },
  previousData: { id: 1, title: 'Hello', ... },
  result: { id: 1, deleted: true },
  db: /* Drizzle instance */
}
```

### Read Hook Context

```typescript
{
  collection: 'posts',
  operation: 'read',
  query: { where: { published: true } },
  result: [{ id: 1, title: 'Hello', ... }],
  db: /* Drizzle instance */
}
```

**beforeRead vs afterRead:**
- `beforeRead` - Runs before the query executes. Use to modify query parameters (add filters, change orderBy, etc.)
- `afterRead` - Runs after data is fetched. Use to transform output (add computed fields, hide sensitive data, etc.)

```typescript
hooks: {
  // Modify query before execution
  beforeRead: [
    async ({ query }) => {
      // Add global filter
      query.where = { ...query.where, deleted: false }
      return query
    }
  ],

  // Transform results after fetch
  afterRead: [
    async ({ result }) => {
      return result.map(post => ({
        ...post,
        excerpt: post.content.substring(0, 100)
      }))
    }
  ]
}
```

## Transactionality

All hooks run within the same database transaction as the main operation. If a hook fails, the entire operation is rolled back.

```typescript
hooks: {
  beforeCreate: [
    async ({ data, db }) => {
      // This runs in the same transaction as the insert
      // If this throws, the create is rolled back
      const count = await db.count({ where: { type: data.type } })
      if (count > 100) {
        throw new Error('Too many records of this type')
      }
      return data
    }
  ]
}
```

## Bypassing Hooks

For migrations, data seeding, or maintenance scripts, you can skip hooks:

```typescript
// Normal update (with hooks)
await posts.update({ where: { id: 1 }, data: { title: 'New' } })

// Skip hooks
await posts.update({ where: { id: 1 }, data: { title: 'New' }, hooks: false })
```

## Input vs Persisted Types

Hooks that add fields (like `createdAt`) change the data that gets stored. The type system distinguishes:

```typescript
// What you pass to create()
type PostInput = {
  title: string
  content: string
  // createdAt is added by beforeCreate hook
}

// What's stored in the database
type PostPersisted = {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}
```

## Examples

### Validate Data

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() })
  },
  hooks: {
    beforeCreate: [
      async (context) => {
        if (context.data.title.length < 3) {
          throw new Error('Title must be at least 3 characters')
        }
      }
    ]
  }
})
```

### Add Timestamps

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() })
  },
  hooks: {
    beforeCreate: [
      async (context) => {
        context.data.createdAt = new Date()
      }
    ],
    beforeUpdate: [
      async (context) => {
        context.data.updatedAt = new Date()
      }
    ]
  }
})
```

### Log Activity

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() })
  },
  hooks: {
    afterCreate: [
      async (context) => {
        console.log(`Post created: ${context.result.id}`)
      }
    ],
    afterDelete: [
      async (context) => {
        console.log(`Post deleted: ${context.previousData.id}`)
      }
    ]
  }
})
```

### Transform Output

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() })
  },
  hooks: {
    afterRead: [
      async (context) => {
        // Add computed field
        context.result = context.result.map(post => ({
          ...post,
          excerpt: post.content.substring(0, 100) + '...'
        }))
      }
    ]
  }
})
```

### Prevent Deletion

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    protected: field({ fieldType: f.boolean() })
  },
  hooks: {
    beforeDelete: [
      async (context) => {
        if (context.previousData.protected) {
          throw new Error('Cannot delete protected posts')
        }
      }
    ]
  }
})
```

### Global Hooks

```typescript
const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  hooks: {
    beforeOperation: [
      async (context) => {
        console.log(`Operation: ${context.operation} on ${context.collection}`)
      }
    ]
  }
})
```

## Auth Hooks

Combine with auth for access control:

```typescript
import { headers } from 'next/headers'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    authorId: field({ fieldType: f.text() })
  },
  hooks: {
    beforeCreate: [
      async (context) => {
        const session = await config.auth.api.getSession({
          headers: await headers()
        })
        if (!session) {
          throw new Error('Must be logged in')
        }
        context.data.authorId = session.user.id
      }
    ],
    beforeUpdate: [
      async (context) => {
        const session = await config.auth.api.getSession({
          headers: await headers()
        })
        if (!session) {
          throw new Error('Must be logged in')
        }
        // Only allow own posts
        if (context.previousData.authorId !== session.user.id) {
          throw new Error('Can only edit your own posts')
        }
      }
    ]
  }
})
```

## Summary

| Hook | When | Common Use |
|------|------|------------|
| `beforeOperation` | Before any operation | Logging, auth check |
| `beforeCreate` | Before creating | Validation, set defaults |
| `afterCreate` | After creating | Notifications, logging |
| `beforeUpdate` | Before updating | Validation, permissions |
| `afterUpdate` | After updating | Notifications, sync |
| `beforeDelete` | Before deleting | Permissions, cascade |
| `afterDelete` | After deleting | Cleanup, logging |
| `beforeRead` | Before reading | Filtering |
| `afterRead` | After reading | Transform, add fields |
