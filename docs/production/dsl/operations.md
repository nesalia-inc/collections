# Operations

Collections provide a type-safe API for database operations. Each collection gets automatically generated methods based on its fields.

## Accessing Operations

Operations are accessed through the config object:

```typescript
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  }
})

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL }),
  collections: [posts]
})

// Access operations via config.db
const db = config.db.posts
```

## Read Operations

### find

Get all records with pagination:

```typescript
const result = await config.db.posts.find()

// result.current.data = [{ id: 1, title: 'Post 1', ... }]
// result.current.total = 100
// result.current.limit = 100
// result.current.offset = 0
```

### find with options

Filter and sort results:

```typescript
const result = await config.db.posts.find({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  limit: 10,
  offset: 0
})
```

### findById

Get a single record by ID:

```typescript
const post = await config.db.posts.findById(1)
// post.data = { id: 1, title: 'Post 1', ... }
```

### findFirst

Get the first record matching conditions:

```typescript
const post = await config.db.posts.findFirst({
  where: { slug: 'my-post' }
})
```

### count

Count records matching conditions:

```typescript
const count = await config.db.posts.count({
  where: { published: true }
})
// count.data = 42
```

### exists

Check if a record exists:

```typescript
const exists = await config.db.posts.exists({
  where: { slug: 'my-post' }
})
// exists.data = true
```

## Write Operations

### create

Create a single record:

```typescript
const post = await config.db.posts.create({
  data: {
    title: 'My Post',
    content: 'Post content here',
    published: true
  }
})
// post.data = { id: 1, title: 'My Post', ... }
```

### createMany

Create multiple records:

```typescript
const result = await config.db.posts.createMany({
  data: [
    { title: 'Post 1', published: true },
    { title: 'Post 2', published: false }
  ]
})
// result.data = 2
```

### update

Update a single record:

```typescript
const updated = await config.db.posts.update({
  where: { id: 1 },
  data: { title: 'Updated Title' }
})
```

### updateMany

Update multiple records:

```typescript
const result = await config.db.posts.updateMany({
  where: { published: true },
  data: { published: false }
})
// result.data = 42 (number of updated records)
```

### delete

Delete a single record:

```typescript
await config.db.posts.delete({
  where: { id: 1 }
})
```

### deleteMany

Delete multiple records:

```typescript
const result = await config.db.posts.deleteMany({
  where: { published: false }
})
// result.data = 10 (number of deleted records)
```

## Operation Options

### where

Filter conditions:

```typescript
{
  where: {
    // Equal
    published: true,

    // Not equal
    status: { ne: 'draft' },

    // In
    id: { in: [1, 2, 3] },

    // Like (contains)
    title: { like: '%hello%' },

    // Greater than
    createdAt: { gt: '2024-01-01' },

    // Less than
    count: { lt: 10 },

    // Is null
    deletedAt: { isNull: true },

    // Is not null
    deletedAt: { isNotNull: true }
  }
}
```

### orderBy

Sort results:

```typescript
// Single field
{ orderBy: { createdAt: 'desc' } }

// Multiple fields
{ orderBy: [
  { published: 'desc' },
  { createdAt: 'asc' }
]}
```

### include

Load relations:

```typescript
{
  include: {
    author: true,
    tags: true
  }
}

// Or with options
{
  include: {
    comments: {
      where: { deleted: false },
      limit: 5
    }
  }
}
```

### select

Select specific fields:

```typescript
{
  select: {
    id: true,
    title: true
  }
}
```

### include (Relations)

Uses SQL JOINs for efficient fetching:

```typescript
const posts = await config.db.posts.find({
  include: {
    author: true,
    comments: true
  }
})
```

## Pagination

### Offset Pagination

```typescript
const result = await config.db.posts.find({
  limit: 10,
  offset: 0
})

// Access data
result.current.data    // [{ id: 1, title: 'Post 1', ... }]
result.current.total   // 100
result.hasNext()       // true
result.hasPrevious()   // false

// Navigate
const nextPage = await result.next()
const prevPage = await result.previous()
```

### Cursor Pagination (Recommended for Large Datasets)

```typescript
const result = await config.db.posts.find({
  cursor: { limit: 10 },
  orderBy: { id: 'desc' }
})

// Navigate using cursor
if (result.hasNext()) {
  const nextPage = await result.next()
}
```

## Return Values

### Paginated Results (find)

```typescript
const result = await config.db.posts.find({ limit: 10 })

result.current.data     // T[] - The records
result.current.total    // number - Total count
result.current.limit    // number - Limit used
result.current.offset   // number - Offset used
result.hasNext()        // boolean
result.hasPrevious()    // boolean
await result.next()     // Promise<Paginated<T> | null>
await result.previous() // Promise<Paginated<T> | null>
```

### Single Results (findById, findFirst, create, update)

```typescript
const result = await config.db.posts.findById(1)
// result.data = { id: 1, title: 'Post 1', ... }
```

### Count and Write Operations

```typescript
const count = await config.db.posts.count({ where: { published: true } })
// count.data = 42

const result = await config.db.posts.createMany({ data: [...] })
// result.data = 2 (number of created records)
```

## Result Pattern

All operations return a result object with `.data` for success or `.error` for failures:

```typescript
const result = await config.db.posts.findById(1)

if (result.error) {
  console.error(result.error)
  return
}

result.data.title
```

### Optional Total Count

Disable the COUNT query for better performance on large tables:

```typescript
const result = await config.db.posts.find({
  limit: 10,
  count: false
})
```

## Transactions

```typescript
await config.db.$transaction(async (tx) => {
  const post = await tx.posts.create({
    data: { title: 'New Post' }
  })

  await tx.tags.create({
    data: { name: 'featured', postId: post.data.id }
  })
})
```

## Type Safety

Operations are fully typed based on your collection definition:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  }
})

// TypeScript knows the shape
const result = await config.db.posts.create({
  data: {
    title: 'Hello',      // string
    published: true     // boolean
  }
})
```

## Examples

### Full CRUD

```typescript
// Create
const post = await config.db.posts.create({
  data: {
    title: 'My Post',
    content: 'Content here',
    published: false
  }
})

// Read
const allPosts = await config.db.posts.find()
const publishedPosts = await config.db.posts.find({
  where: { published: true }
})

// Update
await config.db.posts.update({
  where: { id: post.data.id },
  data: { published: true }
})

// Delete
await config.db.posts.delete({
  where: { id: post.data.id }
})
```

### With Relations

```typescript
// Create post with author
const post = await config.db.posts.create({
  data: {
    title: 'Post with Author',
    author: 'user-123'
  }
})

// Get post with author
const posts = await config.db.posts.find({
  include: { author: true }
})
```

## Summary

| Operation | Method | Description |
|-----------|--------|-------------|
| Read | `find(ops)` | Get paginated records |
| Read | `findById(id)` | Get by ID |
| Read | `findFirst(ops)` | Get first match |
| Read | `count(ops)` | Count records |
| Read | `exists(ops)` | Check existence |
| Write | `create(ops)` | Create record |
| Write | `createMany(ops)` | Create multiple |
| Write | `update(ops)` | Update record |
| Write | `updateMany(ops)` | Update multiple |
| Write | `delete(ops)` | Delete record |
| Write | `deleteMany(ops)` | Delete multiple |