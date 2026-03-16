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

Get all records from a collection (paginated).

```typescript
const result = await config.db.posts.find()

// result.current.data = [{ id: 1, title: 'Post 1', ... }]
// result.current.total = 100
// result.current.limit = 100
// result.current.offset = 0
```

### Pagination

All paginated operations return a `Paginated<T>` object with the current data and navigation methods:

```typescript
interface Paginated<T> {
  current: {
    data: T[]
    total: number
    limit: number
    offset: number
  }
  hasNext(): boolean
  hasPrevious(): boolean
  next(): Promise<Paginated<T> | null>
  previous(): Promise<Paginated<T> | null>
}
```

#### Offset Pagination

Offset pagination uses `limit` and `offset` to skip a number of records:

```typescript
const result = await config.db.posts.find({
  limit: 10,
  offset: 0
})

// Access data
result.current.data    // [{ id: 1, title: 'Post 1', ... }]
result.current.total   // 100
result.current.limit   // 10
result.current.offset  // 0

// Navigation
result.hasNext()      // true
result.hasPrevious()  // false
const nextPage = await result.next()
const prevPage = await result.previous()
```

**Note:** `offset` is the number of records to skip, not the page number. To convert from page number:
```typescript
offset = (page - 1) * limit
```

#### Cursor Pagination (Recommended for Large Datasets)

```typescript
const result = await config.db.posts.find({
  cursor: { limit: 10 },
  orderBy: { id: 'desc' }
})

// Access data
result.current.data    // [{ id: 10, title: 'Post 10', ... }]

// Navigation using cursors
const nextPage = await result.next()
const prevPage = await result.previous()
```

#### Cursor-based Navigation

Cursor pagination automatically handles navigation using the last record's values:

```typescript
// First page
const page1 = await config.db.posts.find({
  cursor: { limit: 10 },
  orderBy: { id: 'desc' }
})

// Get next page - automatically uses last record as cursor
if (page1.hasNext()) {
  const page2 = await page1.next()
  // page2.current.data contains records after page1's last record
}

// Get previous page
if (page2.hasPrevious()) {
  const page1Again = await page2.previous()
}
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

// Access paginated data
result.current.data
result.current.total
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

### Paginated Results (find)

The `find` operation returns a `Paginated<T>` object:

```typescript
const result = await config.db.posts.find({
  limit: 10,
  offset: 0
})

// Access data
result.current.data     // T[] - The records
result.current.total    // number - Total count
result.current.limit    // number - Limit used
result.current.offset  // number - Offset used

// Navigation methods
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
// count
const count = await config.db.posts.count({ where: { published: true } })
// count.data = 42

// createMany, updateMany, deleteMany
const result = await config.db.posts.deleteMany({ where: { published: false } })
// result.data = 10 (number of affected records)
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

// Read (paginated)
const allPosts = await config.db.posts.find()
const publishedPosts = await config.db.posts.find({
  where: { published: true },
  orderBy: { createdAt: 'desc' }
})

// Access data
allPosts.current.data

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

// posts.current.data[0].author = { id: 'user-123', name: 'John' }
```

### Pagination

```typescript
const PAGE_SIZE = 10

// Simple pagination
async function getPage(page: number) {
  return config.db.posts.find({
    orderBy: { createdAt: 'desc' },
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE
  })
}

// With metadata
async function getPaginatedPosts(page: number) {
  const result = await config.db.posts.find({
    orderBy: { createdAt: 'desc' },
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE
  })

  return {
    data: result.current.data,
    page,
    totalPages: Math.ceil(result.current.total / PAGE_SIZE),
    hasNextPage: result.hasNext()
  }
}
```

### Cursor-based Pagination (Performance)

For large datasets, use cursor pagination with navigation methods:

```typescript
// First page - use navigation methods for best performance
async function getPosts(limit: number = 10) {
  return config.db.posts.find({
    cursor: { limit },
    orderBy: { id: 'desc' }
  })
}

// Navigate using methods (recommended)
async function navigatePages() {
  const page1 = await getPosts(10)

  // Go to next page
  if (page1.hasNext()) {
    const page2 = await page1.next()
    // page2.current.data contains next set of records
  }

  // Go back to previous
  if (page2.hasPrevious()) {
    const page1Again = await page2.previous()
  }
}
```

### Paginated API Endpoint

```typescript
// app/api/posts/route.ts
import { config } from '@/lib/collections'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)

  const result = await config.db.posts.find({
    orderBy: { createdAt: 'desc' },
    limit,
    offset: (page - 1) * limit
  })

  return Response.json({
    data: result.current.data,
    meta: {
      page,
      limit,
      total: result.current.total,
      totalPages: Math.ceil(result.current.total / limit),
      hasMore: result.hasNext()
    }
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
