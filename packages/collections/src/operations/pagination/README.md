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
result.current.total   // 100 (null if includeTotal: false)
result.current.limit   // 10
result.current.offset  // 0

// Navigation
result.hasNext      // true (boolean, not method)
result.hasPrevious  // false
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
if (page1.hasNext) {
  const page2 = await page1.next()
  // page2.current.data contains records after page1's last record
}

// Get previous page
if (page2.hasPrevious) {
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
- **hasNext/hasPrevious**: Determined via `limit + 1` strategy. The driver fetches `limit + 1` rows, returns only `limit` to the user, and uses the extra row to determine if there are more results. This is done in a single query, no extra round-trip.
- Use `includeTotal: false` in cursor pagination to skip the count query when you don't need the total.

```typescript
// Skip total count for better performance
const result = await config.db.posts.find({
  pagination: cursor(10, undefined, false),  // includeTotal: false
  orderBy: orderBy(p => [desc(p.createdAt)])
})
// result.current.total is null
```

## Important: Serialization

`Paginated<T>` is **not JSON-serializable** because it contains methods. For API responses:

```typescript
// Extract data and pagination info manually
const response = {
  data: result.current.data,
  pagination: {
    limit: result.current.limit,
    offset: result.current.offset,
    total: result.current.total,
    hasNext: result.hasNext,
    hasPrevious: result.hasPrevious,
  }
}
```

## Types

```typescript
// Paginated result
interface Paginated<T> {
  readonly current: {
    readonly data: T[]
    readonly total: number | null  // null if includeTotal: false
    readonly limit: number
    readonly offset: number
  }
  readonly hasNext: boolean        // boolean (computed via limit+1)
  readonly hasPrevious: boolean
  next(): Promise<Paginated<T> | null>
  previous(): Promise<Paginated<T> | null>
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

Cursor Encoding:
  - Uses btoa/atob (isomorphic - works in Node.js, Browser, Deno, Edge)
  - Handles Date objects specially (preserves Date type)
  - Format: base64(JSON with __date: prefix for Date values)
```

**Key design decisions:**
1. **Isomorphic encoding** - Uses btoa/atob instead of Buffer for cross-platform compatibility
2. **Date preservation** - Custom serialization keeps Date objects as Dates, not strings
3. **Boolean navigation flags** - hasNext/hasPrevious are boolean properties (not methods) computed via limit+1
4. **Explicit null total** - total is `number | null` (never undefined) for clarity
5. **Non-serializable** - Paginated contains methods; extract data for API responses
