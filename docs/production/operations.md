# Collection Operations

Learn how to perform CRUD operations on collections.

## Overview

Collections provide a type-safe API for database operations. Each collection gets automatically generated methods based on its fields.

```typescript
const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts, users]
})

// Access collection operations
config.db.posts.find()
config.db.posts.create()
config.db.posts.update()
config.db.posts.delete()
```

## Find Records

### find

Get all records from a collection.

```typescript
const result = await config.db.posts.find()

// result.data = [{ id: 1, title: 'Post 1', ... }]
// result.meta = { total: 100, limit: 100, offset: 0 }
```

### find with filters

Filter results using `where`:

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
const result = await config.db.posts.findById(1)

// result.data = { id: 1, title: 'Post 1', ... }
```

### findFirst

Get the first record matching conditions:

```typescript
const result = await config.db.posts.findFirst({
  where: { slug: 'my-post' }
})
```

### include relations

Load related records:

```typescript
const result = await config.db.posts.find({
  include: {
    author: true,
    tags: true
  }
})
```

### count

Count records:

```typescript
const result = await config.db.posts.count({
  where: { published: true }
})

// result.data = 42
```

### exists

Check if a record exists:

```typescript
const result = await config.db.posts.exists({
  where: { slug: 'my-post' }
})

// result.data = true
```

## Create Records

### create

Create a single record:

```typescript
const result = await config.db.posts.create({
  data: {
    title: 'My Post',
    content: 'Post content here',
    published: true
  }
})

// result.data = { id: 1, title: 'My Post', ... }
```

### create with relations

Create with related records:

```typescript
const result = await config.db.posts.create({
  data: {
    title: 'My Post',
    content: 'Content',
    author: 'user-123',  // relation ID
    tags: ['tag-1', 'tag-2']  // many relation
  }
})
```

### createMany

Create multiple records:

```typescript
const result = await config.db.posts.createMany({
  data: [
    { title: 'Post 1', published: true },
    { title: 'Post 2', published: false },
    { title: 'Post 3', published: true }
  ]
})

// result.data = 3
```

## Update Records

### update

Update a single record:

```typescript
const result = await config.db.posts.update({
  where: { id: 1 },
  data: {
    title: 'Updated Title',
    published: false
  }
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

## Delete Records

### delete

Delete a single record:

```typescript
const result = await config.db.posts.delete({
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
{
  orderBy: { createdAt: 'desc' }
}

// Multiple fields
{
  orderBy: [
    { published: 'desc' },
    { createdAt: 'asc' }
  ]
}
```

### include

Load relations:

```typescript
{
  include: {
    author: true,      // Load author
    tags: true,       // Load tags
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

## Return Values

All operations return an `OperationResult`:

```typescript
const result = await config.db.posts.find()

// result.data = [...] // The actual data
// result.meta = { ... } // Metadata
```

### Read Operations (find, findById, findFirst)

```typescript
{
  data: T[],
  meta: {
    cacheKeys?: string[]  // Cache keys for invalidation
  }
}
```

### Write Operations (create, update, delete)

```typescript
{
  data: T | number,  // Created/updated record or count
  meta: {
    invalidateKeys?: string[]  // Keys to invalidate in cache
  }
}
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
    title: 'Hello',      // ✓ string
    published: true      // ✓ boolean
  }
})

// This would error:
// config.db.posts.create({ data: { title: 123 } })
```

## Examples

### Full CRUD Example

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
  where: { published: true },
  orderBy: { createdAt: 'desc' }
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

// Get post with author included
const posts = await config.db.posts.find({
  include: { author: true }
})

// posts.data[0].author = { id: 'user-123', name: 'John' }
```

### Pagination

```typescript
const PAGE_SIZE = 10

async function getPage(page: number) {
  return config.db.posts.find({
    orderBy: { createdAt: 'desc' },
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE
  })
}
```

### Search

```typescript
const results = await config.db.posts.find({
  where: {
    OR: [
      { title: { like: searchTerm } },
      { content: { like: searchTerm } }
    ]
  }
})
```

## Summary

| Operation | Method | Description |
|-----------|--------|-------------|
| Read | `find(ops)` | Get all records |
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
