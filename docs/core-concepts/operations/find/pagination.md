# Pagination

All paginated operations return a `Paginated<T>` type with the current data and navigation methods.

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

## Offset Pagination

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

## Cursor Pagination (Recommended for Large Datasets)

```typescript
const result = await config.db.posts.find({
  cursor: { limit: 10 },
  orderBy: (p) => ({ id: p.id.desc })
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
  orderBy: (p) => ({ id: p.id.desc })
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

## Combined with Where and Select

Pagination can be combined with where and select:

```typescript
const page = await config.db.posts.find({
  where: where(p => p.published.eq(true)),
  select: (p) => ({
    id: p.id,
    title: p.title
  }),
  cursor: { limit: 10 },
  orderBy: { createdAt: 'desc' }
})
```

## State Preservation

The `next()` and `previous()` methods automatically preserve all original query parameters:

```typescript
const page1 = await config.db.posts.find({
  where: where(p => p.published.eq(true)),
  select: (p) => ({ id: p.id, title: p.title }),
  cursor: { limit: 10 }
})

// next() keeps where, select, orderBy automatically
const page2 = await page1.next()
// page2 still filters by published and selects only id/title
```

## Cursor Pagination Options

### Manual Cursor

You can pass a manual cursor value:

```typescript
const result = await config.db.posts.find({
  cursor: { value: 'base64-encoded-cursor', limit: 10 },
  orderBy: (p) => ({ createdAt: p.createdAt.desc })
})
```

### Without Total (Better Performance)

For cursor pagination on large datasets, you can skip the total count:

```typescript
const result = await config.db.posts.find({
  cursor: { limit: 10, includeTotal: false },
  orderBy: (p) => ({ id: p.id.desc })
})

// result.current.total is undefined
// This saves a COUNT(*) query on large tables
```

## Performance Notes

- **Offset Pagination**: Returns `total` which requires a `COUNT(*)` query. Can be slow on tables with millions of rows.
- **Cursor Pagination**: More performant for large datasets as it doesn't need to count all records.
- Use `includeTotal: false` in cursor pagination to skip the count query when you don't need the total.
