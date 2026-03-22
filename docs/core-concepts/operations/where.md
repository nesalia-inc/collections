# Where Type

The `where` option uses the `Where` type to specify conditions.

## Type Definition

```typescript
type Where<T = unknown> = {
  [K in keyof T]?: WhereValue<T[K]>
} & LogicalOperators<Where<T>>

// Value can be a direct value or an operator object
type WhereValue<T> =
  | T                                    // Direct value (equality shortcut)
  | ComparisonOperator<T>                // eq, ne, gt, lt, like, etc.
  | NullOperator
  | (T extends unknown[] ? ArrayOperator<T> : never)
  | (T extends object ? Where<T> : never) // Nested filtering for relations

// String-specific operators
type StringOperator = StringComparisonOperator & StringModeOperator

type StringComparisonOperator = {
  eq?: string
  ne?: string
  like?: string        // SQL LIKE (use % for wildcards)
  contains?: string    // LIKE '%value%'
  startsWith?: string  // LIKE 'value%'
  endsWith?: string    // LIKE '%value'
  regex?: string       // Regular expression
}

type StringModeOperator = {
  mode?: 'default' | 'insensitive'  // Case sensitivity
}

// Number-specific operators
type NumberOperator = {
  eq?: number
  ne?: number
  gt?: number
  gte?: number
  lt?: number
  lte?: number
  between?: [number, number]
}

// Date-specific operators (accepts Date or ISO string)
type DateOperator = {
  eq?: Date | string
  ne?: Date | string
  gt?: Date | string
  gte?: Date | string
  lt?: Date | string
  lte?: Date | string
  between?: [Date | string, Date | string]
}

// Array operators
type ArrayOperator<T extends unknown[]> = {
  contains?: T[number]      // Array contains element
  containsAny?: T[number][] // Array contains any of these
  overlaps?: T              // Arrays overlap
}

// Null checks
type NullOperator = {
  isNull?: boolean
  isNotNull?: boolean
}

// Logical operators
type LogicalOperators<T> = {
  AND?: T[]
  OR?: T[]
  NOT?: T
}
```

## Usage Examples

### Basic Comparisons

```typescript
// Equal (shortcut)
{ where: { published: true } }

// Not equal
{ where: { status: { ne: 'draft' } } }

// Greater than
{ where: { count: { gt: 10 } } }

// Less than or equal
{ where: { price: { lte: 100 } } }

// Between (numbers and dates)
{ where: { price: { between: [10, 100] } } }
```

### String Operations

```typescript
// Like (contains)
{ where: { title: { like: '%hello%' } } }

// Contains (shorthand)
{ where: { title: { contains: 'hello' } } }

// Starts with
{ where: { slug: { startsWith: 'news-' } } }

// Ends with
{ where: { email: { endsWith: '@example.com' } } }

// Case insensitive
{ where: { name: { eq: 'john', mode: 'insensitive' } } }

// Regex
{ where: { code: { regex: '^[A-Z]{3}-\\d{4}$' } } }
```

### Date Operations

```typescript
// Date greater than (Date object)
{ where: { createdAt: { gt: new Date('2024-01-01') } } }

// Date greater than (ISO string)
{ where: { createdAt: { gt: '2024-01-01' } } }

// Between dates
{ where: {
  createdAt: {
    between: ['2024-01-01', '2024-12-31']
  }
}}
```

### Array Operations

```typescript
// Array contains element (PostgreSQL @>)
{ where: { tags: { contains: 'featured' } } }

// Array contains any
{ where: { tags: { containsAny: ['news', 'featured'] } } }

// Arrays overlap (PostgreSQL &&)
{ where: { tags: { overlaps: ['tag1', 'tag2'] } } }
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

### Nested / Relation Filtering

Filter by related collection properties:

```typescript
// Filter posts by author's name
{
  where: {
    author: {
      name: { eq: 'John' }
    }
  }
}

// Nested relations
{
  where: {
    author: {
      profile: {
        verified: true
      }
    }
  }
}
```

### Combining Operators

```typescript
{
  where: {
    OR: [
      { title: { contains: 'news' } },
      { content: { contains: 'news' } }
    ],
    published: true,
    authorId: { notIn: ['banned-1', 'banned-2'] },
    createdAt: { gte: '2024-01-01' }
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

## Notes

### Operator Ambiguity

The `contains` operator has different meanings based on the field type:
- **String**: Translates to `LIKE '%value%'`
- **Array**: Translates to `@> array operator` (PostgreSQL) or array contains

### Case Sensitivity

- PostgreSQL: `LIKE` is case-sensitive, use `ILIKE` when `mode: 'insensitive'`
- MySQL: `LIKE` is case-insensitive by default
- SQLite: Use `COLLATE NOCASE` when `mode: 'insensitive'`

### Date Handling

Dates can be passed as JavaScript `Date` objects or ISO strings. The database adapter handles the conversion.
