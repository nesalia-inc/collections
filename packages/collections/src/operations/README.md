# Operations

Query and data manipulation operations for collections.

## Structure

```
operations/
├── database/    # Database operation types (findMany, create, update, delete...)
├── order-by/   # Type-safe ordering with asc/desc terminals
└── where/      # Type-safe filtering with PathProxy (recommended)
```

## Database Operations

Types for collection data access. Used via `config.db.<collection>`.

```typescript
import { defineConfig, where, eq, orderBy, asc, desc } from '@deessejs/collections'
```

### Query Types

```typescript
// FindManyQuery - supports ordering, pagination, and field selection
config.db.posts.findMany({
  where: where(p => [eq(p.published, true)]),
  orderBy: orderBy(p => [desc(p.createdAt)]),
  select: ['id', 'title', 'createdAt'],
  limit: 10,
  offset: 0
})

// findFirst - find one matching record
config.db.users.findFirst({
  where: where(p => [eq(p.email, 'john@example.com')]),
  orderBy: orderBy(p => [asc(p.createdAt)])
})

// count - count matching records
config.db.posts.count({
  where: where(p => [eq(p.published, true)])
})

// exists - check if any record exists
config.db.posts.exists({
  where: where(p => [eq(p.slug, 'my-post')])
})
```

### Mutation Types

```typescript
// create - insert single record
// Required fields must be provided; optional fields can be omitted
config.db.posts.create({
  data: { title: 'Hello', slug: 'hello-world' } // content is optional
})

// createMany - insert multiple records
// Returns { count, insertedIds? } - no full records for performance
config.db.posts.createMany({
  data: [
    { title: 'Post 1', slug: 'post-1' },
    { title: 'Post 2', slug: 'post-2' }
  ]
})

// update - update by predicate
// Returns { records: T[], count } for records affected
config.db.posts.update({
  where: where(p => [eq(p.slug, 'my-post')]),
  data: { title: 'Updated Title' }
})

// delete - delete by predicate
// Returns { records: T[], count } for records deleted
config.db.posts.delete({
  where: where(p => [eq(p.id, '123')])
})
```

### Unique Lookups

```typescript
// findUnique - by id (string or number)
config.db.posts.findUnique({ where: { id: '123' } })

// findUnique - by unique field (e.g., slug, email)
config.db.users.findUnique({ where: { email: 'john@example.com' } })
```

### Query Context

All methods accept optional `QueryContext` for transaction and timeout control:

```typescript
// With timeout
config.db.posts.findMany({ where: isPublished }, { timeout: 5000 })

// With transaction (implementation-specific)
const tx = await db.beginTransaction()
config.db.posts.create({ data: postData }, { transaction: tx })
await db.commit(tx)
```

## Where Operations

Type-safe filtering system using the **Functional-Applicative** pattern. See [where/README.md](./where/README.md) for full documentation.

### Quick Example

```typescript
import { where, and, or, eq, gt, contains } from '@deessejs/collections'

// Simple filter
const isPublished = where(p => [eq(p.published, true)])

// Combined filter
const targetPosts = and(
  isPublished,
  where(p => [gt(p.views, 100)])
)

// With null safety
const hasTitle = where(p => [eq(p.title, null)])
```

### Operators

| Category | Operators |
|----------|-----------|
| Comparison | `eq`, `ne`, `gt`, `gte`, `lt`, `lte` |
| Range | `between`, `inList`, `notInList` |
| Null | `isNull`, `isNotNull` |
| String | `like`, `contains`, `startsWith`, `endsWith`, `regex` |
| Array | `has`, `hasAny`, `overlaps` |

### Logical Combinators

```typescript
and(predicate1, predicate2, ...)
or(predicate1, predicate2, ...)
not(predicate)
```

## Order-by Operations

Type-safe ordering using the **Functional-Applicative** pattern. See [order-by/README.md](./order-by/README.md) for full documentation.

### Quick Example

```typescript
import { orderBy, asc, desc } from '@deessejs/collections'

// Single field
const byDate = orderBy(p => [desc(p.createdAt)])

// Multi-criteria
const byStatusAndDate = orderBy(p => [
  asc(p.status),
  desc(p.createdAt)
])
```

### Operators

| Operator | Description |
|----------|-------------|
| `asc` | Sort in ascending order |
| `desc` | Sort in descending order |

## Files

- `index.ts` - Module exports (where + order-by + database)
- `path.ts` - Shared PathProxy implementation
- `database/types.ts` - Database operation types
- `order-by/` - Ordering system
- `where/` - Filtering system
