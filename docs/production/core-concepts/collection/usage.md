# Using Collections

How to use collections in your application.

## In defineConfig

Once defined, collections are used in `defineConfig`:

```typescript
import { defineConfig, pgAdapter } from '@deessejs/collections'

const posts = collection({ /* ... */ })
const users = collection({ /* ... */ })

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL }),
  collections: [posts, users]
})
```

## Collection API

The config provides a typed API for each collection:

```typescript
// The config provides typed CRUD operations
const { posts, users } = config.collections

// Create
const post = await posts.create({
  title: 'Hello World',
  content: 'My first post',
  author: user.id
})

// Find one
const found = await posts.find(post.id)

// Find many
const all = await posts.findMany({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  limit: 10
})

// Update
const updated = await posts.update(post.id, {
  title: 'Updated Title'
})

// Delete
await posts.delete(post.id)
```

## Database Operations

Access via `config.db`:

```typescript
// Create
const post = await config.db.posts.create({
  data: { title: 'Hello' }
})

// Read
const posts = await config.db.posts.find({ limit: 10 })

// Update
await config.db.posts.update({
  where: { id: 1 },
  data: { title: 'Updated' }
})

// Delete
await config.db.posts.delete({ where: { id: 1 } })
```

## TypeScript Inference

Collections automatically infer TypeScript types:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() }),
    count: field({ fieldType: f.number() })
  }
})

// Automatically inferred!
type Post = GetCollectionType<typeof posts>
// {
//   id: string
//   title: string
//   published: boolean
//   count: number
//   createdAt: Date
//   updatedAt: Date
// }
```

### Usage in Functions

```typescript
function getPost(id: string) {
  return config.db.posts.findById({ id })
}

// Return type is fully typed
const post = await getPost('123')
// post: { data: Post | null, ... }
```

## Best Practices

1. **Use descriptive slugs**: `'posts'`, `'user-profiles'`
2. **Define hooks for business logic**: Keep controllers clean
3. **Use indexes for queries**: Add indexes for fields you filter/sort by
4. **Keep collections focused**: One collection per logical entity
5. **Define relations explicitly**: Use the relations config for clarity

## Related

- [Operations](../operations.md) - CRUD operations
- [Fields](./fields.md) - Field definitions
- [Hooks](./hooks.md) - Lifecycle hooks
