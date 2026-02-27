# @deessejs/collections

A functional-first collection and data modeling layer built on Drizzle ORM.

## Developer Experience

### Type-Safe Collection Access

Collections are inferred from your configuration, providing full autocompletion:

```typescript
const config = defineConfig({
  database: { url: process.env.DATABASE_URL! },
  collections: [users, posts]
})

// Autocomplete: config.collections.⟨users|posts⟩ ✅
const allUsers = await config.collections.users.findMany()
const allPosts = await config.collections.posts.findMany()
```

### Type-Safe Operations

All CRUD operations are fully typed with autocompletion support:

```typescript
// findMany - with filters, sorting, pagination
const users = await config.collections.users.findMany({
  where: { email: { contains: '@example.com' } },
  orderBy: { createdAt: 'desc' },
  limit: 10,
  offset: 0
})

// findUnique - find by unique identifier
const user = await config.collections.users.findUnique({
  where: { id: 1 }
})

// findFirst - find first match with ordering
const activeUser = await config.collections.users.findFirst({
  where: { status: 'active' },
  orderBy: { createdAt: 'asc' }
})

// create - insert a record
const newUser = await config.collections.users.create({
  data: { name: 'John', email: 'john@example.com' }
})

// update - update a record
const updatedUser = await config.collections.users.update({
  where: { id: 1 },
  data: { name: 'Jane' }
})

// delete - delete a record
await config.collections.users.delete({
  where: { id: 1 }
})

// count - count records
const count = await config.collections.users.count({
  where: { status: 'active' }
})

// exists - check if record exists
const exists = await config.collections.users.exists({
  where: { email: 'john@example.com' })
})
```

### Where Operators

The `where` clause supports various operators with full type inference:

```typescript
const results = await config.collections.users.findMany({
  where: {
    // Equality
    email: 'john@example.com',
    // Comparison
    age: { gt: 18, lte: 65 },
    // Inclusion
    role: { in: ['admin', 'user'] },
    // String matching
    name: { contains: 'John', startsWith: 'J' },
    // Null handling
    deletedAt: { isNull: true },
    // Negation
    status: { not: 'banned' }
  }
})
```

### Metadata Access

Collection metadata is available through `$meta`:

```typescript
// $meta.collections gives you all collection slugs
config.$meta.collections // ['users', 'posts']

// $meta.plugins gives you loaded plugin names
config.$meta.plugins // ['timestamps', 'soft-delete']
```

## Quick Start

```bash
pnpm install @deessejs/collections
```

```typescript
import { defineConfig, collection, field, f } from '@deessejs/collections'

// Define collections
const users = collection({
  slug: 'users',
  name: 'Users',
  fields: {
    name: field({ fieldType: f.text() }),
    email: field({ fieldType: f.text(), unique: true }),
    age: field({ fieldType: f.number() })
  }
})

const posts = collection({
  slug: 'posts',
  name: 'Posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  }
})

// Create configuration
export const { collections, db, $meta } = defineConfig({
  database: {
    url: process.env.DATABASE_URL!
  },
  collections: [users, posts]
})
```

## Features

- **Type-safe** - Full TypeScript inference for collections and operations
- **Functional** - Clean, composable API
- **Plugin system** - Extend with hooks and custom collections
- **Drizzle-based** - Built on top of Drizzle ORM
