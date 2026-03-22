# Find Records

Learn how to query records from collections.

## find

Get all records from a collection (paginated).

```typescript
const result = await config.db.posts.find()

// result.current.data = [{ id: 1, title: 'Post 1', ... }]
// result.current.total = 100
// result.current.limit = 100
// result.current.offset = 0
```

## Pagination

All paginated operations return a `Paginated<T>` type with the current data and navigation methods:

```typescript
type Paginated<T> = {
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

### Offset Pagination

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

### Cursor Pagination (Recommended for Large Datasets)

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

### Cursor-based Navigation

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

## find with filters

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

**Note:** Each record in `data` is enriched with instance methods:

```typescript
const { data: posts } = await db.posts.find({ where: { published: true } })
for (const post of posts) {
  await post.publish()  // Each post has instance methods
}
```

## findById

Get a single record by ID:

```typescript
const result = await config.db.posts.findById(1)

// result.data = { id: 1, title: 'Post 1', ... }
```

**Note:** The returned record is enriched with instance methods defined in the collection:

```typescript
const { data: post } = await db.posts.findById(1)
await post.publish()  // Calls the publish instance method if defined
```

## findFirst

Get the first record matching conditions:

```typescript
const result = await config.db.posts.findFirst({
  where: { slug: 'my-post' }
})
```

## include relations

Load related records:

```typescript
const result = await config.db.posts.find({
  include: {
    author: true,
    tags: true
  }
})
```

## count

Count records:

```typescript
const result = await config.db.posts.count({
  where: { published: true }
})

// result.data = 42
```

## exists

Check if a record exists:

```typescript
const result = await config.db.posts.exists({
  where: { slug: 'my-post' }
})

// result.data = true
```
