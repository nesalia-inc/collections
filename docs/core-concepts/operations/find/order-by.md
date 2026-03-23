# OrderBy

The `orderBy` option allows you to sort query results by one or more fields.

## Type Definition

```typescript
type OrderBy = {
  [K in keyof T]?: 'asc' | 'desc'
}

type OrderByArray = Array<{ field: keyof T; order: 'asc' | 'desc' }>
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
- Null values are typically sorted first in ascending order
