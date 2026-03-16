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
const users = collection({
  slug: 'users',
  name: 'Users',
  fields: {
    name: field({ fieldType: f.text() }),
    email: field({ fieldType: f.email(), unique: true }),
    age: field({ fieldType: f.number() })
  }
})

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
  collections: [users, posts]
})
```

## Access Metadata

```typescript
// Access collection metadata
console.log(config.collections.users.slug) // 'users'
console.log(config.collections.posts.slug)  // 'posts'
```

## Perform CRUD Operations

```typescript
const { db } = config

// Create a user
const user = await db.users.create({
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  }
})

// Create a post with relation to user
const post = await db.posts.create({
  data: {
    title: 'My First Post',
    content: 'Content here',
    published: true,
    author: user.id
  }
})

// Find users
const allUsers = await db.users.findMany()

// Find with filters
const publishedPosts = await db.posts.findMany({
  where: { published: true }
})

// Find posts with author included
const postsWithAuthors = await db.posts.findMany({
  include: { author: true }
})

// Update
await db.users.update({
  where: { id: user.id },
  data: { age: 31 }
})

// Delete
await db.users.delete({ where: { id: user.id } })
```

## Next Steps

- [Field Types](./field-types) - Learn about all available field types
- [Configuration](./configuration) - Advanced configuration options
- [Hooks](./hooks) - Add lifecycle logic to your collections
