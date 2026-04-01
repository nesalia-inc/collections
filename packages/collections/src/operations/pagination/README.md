# Pagination

Type-safe pagination with offset and cursor-based navigation.

## Public API

```typescript
import { offset, cursor, page, Paginated } from '@deessejs/collections'
```

## Offset Pagination

Offset pagination uses limit and offset to skip a number of records:

```typescript
const result = await config.db.posts.find({
  pagination: offset(10, 0),
  orderBy: orderBy(p => [desc(p.createdAt)])
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

Note: offset is the number of records to skip, not the page number. To convert from page number:

```typescript
offset = (page - 1) * limit
```

Or use the `page` helper:

```typescript
const result = await config.db.posts.find({
  pagination: page(1, 10),  // page 1, limit 10
  orderBy: orderBy(p => [desc(p.createdAt)])
})
```

## Cursor Pagination (Recommended for Large Datasets)

Cursor pagination is more performant for large datasets as it avoids COUNT(*) queries:

```typescript
const result = await config.db.posts.find({
  pagination: cursor(10),  // limit 10, no cursor yet
  orderBy: orderBy(p => [desc(p.createdAt)])
})

// Access data
result.current.data    // [{ id: 10, title: 'Post 10', ... }]

// Navigation using cursors
const nextPage = await result.next()
const prevPage = await result.previous()
```

## Cursor-based Navigation

Cursor pagination automatically handles navigation using the last record's values:

```typescript
// First page
const page1 = await config.db.posts.find({
  pagination: cursor(10),
  orderBy: orderBy(p => [desc(p.createdAt)])
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
  where: where(p => [eq(p.published, true)]),
  select: (p) => ({
    id: p.id,
    title: p.title
  }),
  pagination: cursor(10),
  orderBy: orderBy(p => [desc(p.createdAt)])
})
```

## State Preservation

The next() and previous() methods automatically preserve all original query parameters:

```typescript
const page1 = await config.db.posts.find({
  where: where(p => [eq(p.published, true)]),
  select: (p) => ({ id: p.id, title: p.title }),
  pagination: cursor(10),
  orderBy: orderBy(p => [desc(p.createdAt)])
})

// next() keeps where, select, orderBy automatically
const page2 = await page1.next()
// page2 still filters by published and selects only id/title
```

## Performance Notes

- **Offset Pagination**: Returns total which requires a COUNT(*) query. Can be slow on tables with millions of rows.
- **Cursor Pagination**: More performant for large datasets as it doesn't need to count all records.
- Use `includeTotal: false` in cursor pagination to skip the count query when you don't need the total.

```typescript
// Skip total count for better performance
const result = await config.db.posts.find({
  pagination: cursor(10, undefined, false),  // includeTotal: false
  orderBy: orderBy(p => [desc(p.createdAt)])
})
// result.current.total is undefined
```

## Types

```typescript
// Paginated result
interface Paginated<T> {
  readonly current: {
    readonly data: T[]
    readonly total?: number
    readonly limit: number
    readonly offset: number
  }
  hasNext(): boolean
  hasPrevious(): boolean
  next(): Promise<Paginated<T> | null>
  previous(): Promise<Paginated<T> | null>
  getTotal(): Promise<number | undefined>
}

// Offset pagination
interface OffsetPaginationInput {
  readonly _tag: 'OffsetPagination'
  readonly limit: number
  readonly offset: number
  readonly includeTotal?: boolean
}

// Cursor pagination
interface CursorPaginationInput {
  readonly _tag: 'CursorPagination'
  readonly limit: number
  readonly cursor?: string
  readonly includeTotal?: boolean
}
```

## Architecture

```
                    PaginationInput
                           │
           ┌───────────────┴───────────────┐
           │                               │
  OffsetPaginationInput          CursorPaginationInput
           │                               │
     limit + offset                  limit + cursor
     includeTotal                   includeTotal
```

**Key design decisions:**
1. **Immutability** - next() returns new instance, does not modify current
2. **State preservation** - Navigation methods replay exact query with modified cursor/offset
3. **Lazy total** - getTotal() is a Promise to avoid unnecessary COUNT(*) queries
4. **Deterministic cursors** - Cursor values include all orderBy fields for uniqueness
