# Where Type

The `where` option uses the `Where` type to specify conditions.

## Type Definition

```typescript
type Filter<T = unknown> = {
  [K in keyof T]?: FilterValue<T[K]>
} & LogicalOperators<Filter<T>>

type FilterValue<T> =
  | T
  | ComparisonOperator<T>
  | ArrayFilterOperator<T>
  | NullOperator

type ComparisonOperator<T> = {
  eq?: T
  ne?: T
  gt?: T
  gte?: T
  lt?: T
  lte?: T
  like?: string
  contains?: T
  startsWith?: T
  endsWith?: T
}

type ArrayFilterOperator<T> = {
  in?: T[]
  notIn?: T[]
  contains?: T[]
  overlaps?: T[]
}

type NullOperator = {
  isNull?: boolean
  isNotNull?: boolean
}

type LogicalOperators<T> = {
  AND?: T[]
  OR?: T[]
  NOT?: T
}
```

## Usage Examples

### Basic Comparisons

```typescript
// Equal
{ where: { published: true } }

// Not equal
{ where: { status: { ne: 'draft' } } }

// Greater than
{ where: { count: { gt: 10 } } }

// Less than or equal
{ where: { price: { lte: 100 } } }
```

### String Operations

```typescript
// Like (contains)
{ where: { title: { like: '%hello%' } } }

// Starts with
{ where: { slug: { startsWith: 'news-' } } }

// Ends with
{ where: { email: { endsWith: '@example.com' } } }
```

### Array Operations

```typescript
// In
{ where: { id: { in: [1, 2, 3] } } }

// Not in
{ where: { status: { notIn: ['draft', 'archived'] } } }
```

### Null Checks

```typescript
// Is null
{ where: { deletedAt: { isNull: true } } }

// Is not null
{ where: { publishedAt: { isNotNull: true } } }
```

### Logical Operators

```typescript
// AND
{
  where: {
    AND: [
      { published: true },
      { authorId: 'user-123' }
    ]
  }
}

// OR
{
  where: {
    OR: [
      { status: 'draft' },
      { status: 'review' }
    ]
  }
}

// NOT
{
  where: {
    NOT: { published: true }
  }
}
```

### Combining Operators

```typescript
{
  where: {
    OR: [
      { title: { like: '%news%' } },
      { content: { like: '%news%' } }
    ],
    published: true,
    authorId: { notIn: ['banned-1', 'banned-2'] }
  }
}
```

## Usage in Operations

```typescript
// Find
await config.db.posts.find({
  where: { published: true }
})

// Update
await config.db.posts.update({
  where: { status: 'draft' },
  data: { status: 'published' }
})

// Delete
await config.db.posts.delete({
  where: { createdAt: { lt: '2024-01-01' } }
})

// Count
await config.db.posts.count({
  where: { published: true }
})
```
