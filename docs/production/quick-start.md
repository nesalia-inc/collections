# Quick Start

Get started with @deessejs/collections in minutes.

## Installation

```bash
pnpm add @deessejs/collections drizzle-orm
```

## Define Collections

```typescript
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'

// Define collections
const posts = collection({
  slug: 'posts',
  name: 'Posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})

// Create configuration
const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts]
})
```

## Access Metadata

```typescript
// Access collection metadata
console.log(config.collections.posts.slug)  // 'posts'
```

## Perform CRUD Operations

```typescript
const { db } = config

// Create a post
const post = await db.posts.create({
  data: {
    title: 'My First Post',
    content: 'Content here',
    published: true,
    author: 'user-id-from-auth'
  }
})

// Find posts
const allPosts = await db.posts.findMany()

// Find with filters
const publishedPosts = await db.posts.findMany({
  where: { published: true }
})

// Find posts with author included
const postsWithAuthors = await db.posts.findMany({
  include: { author: true }
})

// Update
await db.posts.update({
  where: { id: post.id },
  data: { published: false }
})

// Delete
await db.posts.delete({ where: { id: post.id } })
```

## With Authentication (Optional)

Auth is optional. If enabled, it creates users, sessions, accounts, and verification tables automatically.

```typescript
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})

// With auth - creates user, session, account, verification tables
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  auth: {
    emailAndPassword: { enabled: true }
  }
})

// Without auth - no auth tables, just your collections
export const configLocal = defineConfig({
  database: sqliteAdapter({ url: './data.db' }),
  collections: [posts]
})
```

## Next Steps

- [Authentication](./authentication) - Set up auth with users collection
- [Next.js](./nextjs) - App Router integration with route handlers
- [API](./api) - REST API endpoints
- [Field Types](./field-types) - Learn about all available field types
- [Configuration](./configuration) - Advanced configuration options
- [Hooks](./hooks) - Add lifecycle logic to your collections
