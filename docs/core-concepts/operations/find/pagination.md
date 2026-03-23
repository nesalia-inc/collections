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
