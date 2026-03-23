# OrderBy

The `orderBy` option allows you to sort query results by one or more fields.

## Type Definition

```typescript
type OrderBy<T> = (selector: OrderBySelector<T>) => OrderByFields<T>

type OrderBySelector<T> = {
  [K in keyof T]: T[K] extends object ? OrderBySelector<T[K]> : OrderByField
}

type OrderByField = {
  asc(): OrderByConfig
  desc(): OrderByConfig
}

type OrderByConfig = {
  order: 'asc' | 'desc'
  nulls?: 'first' | 'last'
  mode?: 'default' | 'insensitive'
}

interface OrderByConfig {
  nullsFirst(): OrderByConfig
  nullsLast(): OrderByConfig
  insensitive(): OrderByConfig
}

type OrderByFields<T> = {
  [K in keyof T]?: T[K] extends object ? OrderByFields<T[K]> : OrderByConfig
}
```

## Basic Usage

```typescript
const result = await config.db.posts.find({
  orderBy: (p) => ({
    createdAt: p.createdAt.desc()
  })
})
```

## Multiple Fields

Sort by multiple fields (first field has highest priority):

```typescript
const result = await config.db.posts.find({
  orderBy: (p) => ({
    status: p.status.asc(),
    createdAt: p.createdAt.desc()
  })
})
```

## Nulls Handling

Compose with nulls handling:

```typescript
// Nulls first
const result = await config.db.posts.find({
  orderBy: (p) => ({
    deletedAt: p.deletedAt.asc().nullsFirst()
  })
})

// Nulls last
const result = await config.db.posts.find({
  orderBy: (p) => ({
    deletedAt: p.deletedAt.desc().nullsLast()
  })
})
```

## Case Insensitive Sort

Compose with case insensitive:

```typescript
const result = await config.db.posts.find({
  orderBy: (p) => ({
    title: p.title.asc().insensitive()
  })
})
```

## Combine Options

Chain multiple options:

```typescript
const result = await config.db.posts.find({
  orderBy: (p) => ({
    title: p.title.desc().nullsLast().insensitive()
  })
})
```

## Nested Sort (Relations)

Sort by fields in related collections:

```typescript
const result = await config.db.posts.find({
  orderBy: (p) => ({
    author: {
      name: p.author.name.asc()
    }
  })
})
```

## With Where

Combine with where condition:

```typescript
const result = await config.db.posts.find({
  where: where(p => p.published.eq(true)),
  orderBy: (p) => ({
    createdAt: p.createdAt.desc()
  })
})
```

## With Cursor Pagination

Required for cursor pagination to ensure consistent ordering:

```typescript
const page = await config.db.posts.find({
  cursor: { limit: 10 },
  orderBy: (p) => ({
    id: p.id.desc()
  })
})
```

## Notes

- Always specify `orderBy` when using cursor pagination to ensure consistent results
- The order of fields in the object matters - first field has highest priority
- Use `.asc()` for ascending (A-Z, 0-9) and `.desc()` for descending (Z-A, 9-0)
- Chain `.nullsFirst()`, `.nullsLast()` for null handling
- Chain `.insensitive()` for case-insensitive string sorting
- Full autocomplete support for all fields and nested relations
