# Where Type

Collections provides a powerful, type-safe filtering system. There are two approaches: the **Object** approach (JSON-like) and the **Functional-Fluent** approach (Proxy-based).

## Object Approach

The JSON-like approach is great for serialization (REST APIs, stored filters).

```typescript
{ where: { published: true, status: { ne: 'draft' } } }
```

See [Where Type Definition](#where-type-definition) below for the complete type.

---

## Functional-Fluent Approach (Recommended)

The functional approach uses **Proxies** to capture your intent in a type-safe way, producing an immutable **AST (Abstract Syntax Tree)** that can be compiled to SQL or in-memory predicates.

### Why Functional-Fluent?

| Feature | Object Approach | Functional-Fluent |
|---------|-----------------|-------------------|
| **Composition** | Difficult (deep merge) | Natural (`and(f1, f2)`) |
| **Reusability** | Copy-paste JSON | Named functions |
| **Refactoring** | Hard (string keys) | Easy (typed symbols) |
| **In-Memory** | Requires manual parser | Native predicate compiler |
| **Autocomplete** | Partial | Full (`p.`) |

### Basic Usage

```typescript
import { where, and, or, not, eq, gt, contains } from '@deessejs/collections'

// Define reusable predicates
const isPublished = where(p => p.published.eq(true))
const isRecent = where(p => p.createdAt.gt(new Date('2024-01-01')))
const isDraft = not(isPublished)

// Compose them
const targetPosts = and(isRecent, isPublished)
```

### Filter Composition

```typescript
// Complex filtering with fluent syntax
const searchFilter = where(p => or(
  p.title.contains('TypeScript'),
  p.content.contains('Functional'),
  and(
    p.category.eq('Programming'),
    p.tags.has('Advanced')
  )
))
```

### Deep Path Filtering (Relations)

The Proxy naturally captures the path without magic strings:

```typescript
const filterByAuthor = where(p =>
  p.author.profile.location.eq('Paris')
)

// SQL: WHERE author.profile.location = 'Paris'
```

### Multi-Target Interpretation

The same filter AST can be interpreted two ways:

```typescript
const myFilter = and(isPublished, isRecent)

// 1. Database usage
const postsFromDb = await db.posts.find({ where: myFilter })

// 2. In-memory usage (UI filtering, unit tests)
// Compiles AST to JS predicate: (item) => boolean
const isMatch = compileToPredicate(myFilter)

const filteredLocally = localPosts.filter(isMatch)
```

### Custom DSL Extensions

Extend the DSL without modifying the core types:

```typescript
// Custom operator
const priceInRange = (min: number, max: number) =>
  where<Product>(p => and(
    p.price.gte(min),
    p.price.lte(max)
  ))

const affordable = priceInRange(10, 50)
```

---

## Where Type Definition

For the Object approach, here's the complete type system:

```typescript
type Where<T = unknown> = {
  [K in keyof T]?: WhereValue<T[K]>
} & LogicalOperators<Where<T>> & GlobalSearchOperator

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
  in?: string[]        // IN ('a', 'b', 'c')
  notIn?: string[]    // NOT IN ('a', 'b', 'c')
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
  in?: number[]        // IN (1, 2, 3)
  notIn?: number[]     // NOT IN (1, 2, 3)
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
  contains?: T[number]      // Array contains element (@> PostgreSQL)
  has?: T[number]          // Alias for contains
  hasAny?: T[number][]    // Array contains any of these
  containsAny?: T[number][] // Alias for hasAny
  overlaps?: T            // Arrays overlap (&& PostgreSQL)
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

// Global search operator (applies to all text fields)
type GlobalSearchOperator = {
  _search?: string  // Searches across all text fields
}
```

---

## Object Usage Examples

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

### Global Search (Magic String)

Search across all text fields at once:

```typescript
// Searches all text fields (title, content, description, etc.)
{ where: { _search: 'TypeScript' } }

// SQL generated: WHERE title ILIKE '%TypeScript%' OR content ILIKE '%TypeScript%' ...

// Combine with other filters
{
  where: {
    _search: 'react',
    published: true,
    category: 'tech'
  }
}
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
// Array contains element (PostgreSQL @>).
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

---

## Usage in Operations

```typescript
// Object approach
await config.db.posts.find({
  where: { published: true }
})

// Functional approach
await config.db.posts.find({
  where: and(isPublished, isRecent)
})

// Functional approach (shorthand - function passed directly)
await config.db.posts.find(and(isPublished, isRecent))
```

## Notes

### Operator Ambiguity: `contains`

The `contains` operator has different meanings based on the field type:

| Field Type | Example | SQL Translation |
|------------|---------|-----------------|
| **String** | `{ title: { contains: 'hello' } }` | `LIKE '%hello%'` |
| **Array** | `{ tags: { contains: 'featured' } }` | `@> 'featured'` (PostgreSQL) |

### Array `has` Operator

For arrays, use `has` for a more explicit API:

```typescript
// Array contains element (equivalent to contains)
{ where: { tags: { has: 'featured' } } }

// Check if array contains any of these elements
{ where: { tags: { hasAny: ['news', 'featured'] } } }
```

### Case Sensitivity

- PostgreSQL: `LIKE` is case-sensitive, use `ILIKE` when `mode: 'insensitive'`
- MySQL: `LIKE` is case-insensitive by default
- SQLite: Use `COLLATE NOCASE` when `mode: 'insensitive'`

### Date Handling

Dates can be passed as JavaScript `Date` objects or ISO strings. The database adapter handles the conversion.
