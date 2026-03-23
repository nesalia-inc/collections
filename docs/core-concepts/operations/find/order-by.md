# OrderBy

The `orderBy` option allows you to sort query results by one or more fields.

## Type Definition

```typescript
type OrderBy<T> = OrderByObject<T> | OrderByArray<T>

type OrderByObject<T> = {
  [K in keyof T]?: T[K] extends object ? OrderBy<T[K]> : OrderByValue
}

type OrderByValue = {
  order: 'asc' | 'desc'
  nulls?: 'first' | 'last'
  mode?: 'default' | 'insensitive'
}

type OrderByArray<T> = Array<{
  field: keyof T
  order: 'asc' | 'desc'
  nulls?: 'first' | 'last'
  mode?: 'default' | 'insensitive'
}>
```

## Basic Usage

```typescript
const result = await config.db.posts.find({
  orderBy: { createdAt: 'desc' }
})
```

## Multiple Fields

Sort by multiple fields (order matters):

```typescript
const result = await config.db.posts.find({
  orderBy: [
    { field: 'status', order: 'asc' },
    { field: 'createdAt', order: 'desc' }
  ]
})
```

## With Nulls Handling

Control where null values appear in the sorted results:

```typescript
// Nulls first (before non-null values)
const result = await config.db.posts.find({
  orderBy: { deletedAt: { order: 'asc', nulls: 'first' } }
})

// Nulls last (after non-null values)
const result = await config.db.posts.find({
  orderBy: { deletedAt: { order: 'asc', nulls: 'last' } }
})
```

## Case Insensitive Sort

Sort strings ignoring case:

```typescript
const result = await config.db.posts.find({
  orderBy: { title: { order: 'asc', mode: 'insensitive' } }
})
```

## Nested Sort (Relations)

Sort by fields in related collections:

```typescript
const result = await config.db.posts.find({
  orderBy: {
    author: {
      name: 'asc'
    }
  }
})
```

```typescript
// With options on nested field
const result = await config.db.posts.find({
  orderBy: {
    author: {
      name: { order: 'asc', mode: 'insensitive' }
    }
  }
})
```

## With Where

Combine with where condition:

```typescript
const result = await config.db.posts.find({
  where: where(p => p.published.eq(true)),
  orderBy: { createdAt: 'desc' }
})
```

## With Cursor Pagination

Required for cursor pagination to ensure consistent ordering:

```typescript
const page = await config.db.posts.find({
  cursor: { limit: 10 },
  orderBy: { id: 'desc' }
})
```

## Notes

- Always specify `orderBy` when using cursor pagination to ensure consistent results
- The order of fields in array notation matters - first field has highest priority
- Use `asc` for ascending (A-Z, 0-9) and `desc` for descending (Z-A, 9-0)
- Default null behavior may vary by database (PostgreSQL: nulls last by default in ascending order)
- Use `mode: 'insensitive'` for case-insensitive string sorting
