# Operations

Query and data manipulation operations for collections.

## Structure

```
operations/
├── database/   # Database operation types (findMany, create, update, delete...)
└── where/      # Type-safe filtering with PathProxy (recommended)
```

## Database Operations

Types for collection data access. Used via `config.db.<collection>`.

```typescript
import { defineConfig, where, eq } from '@deessejs/collections'
```

### Query Types

```typescript
// FindManyQuery - used by findMany
config.db.posts.findMany({
  where: where(p => [eq(p.published, true)]),
  orderBy: 'createdAt',
  limit: 10,
  offset: 0
})

// findFirst - find one matching record
config.db.users.findFirst({
  where: where(p => [eq(p.email, 'john@example.com')])
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
config.db.posts.create({
  data: { title: 'Hello', content: 'World' }
})

// createMany - insert multiple records
config.db.posts.createMany({
  data: [
    { title: 'Post 1' },
    { title: 'Post 2' }
  ]
})

// update - update by id
config.db.posts.update({
  where: { id: '123' },
  data: { title: 'Updated Title' }
})

// updateById - update by id directly
config.db.posts.updateById('123', { title: 'Updated Title' })

// delete - delete by id
config.db.posts.delete({ where: { id: '123' } })

// deleteById - delete by id directly
config.db.posts.deleteById('123')
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

## Files

- `index.ts` - Module exports (where + database)
- `database/types.ts` - Database operation types
- `where/` - Filtering system
