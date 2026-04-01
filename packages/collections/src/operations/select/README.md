# Select

Type-safe field selection using the **Functional-Applicative** pattern.

## Public API

```typescript
import { select } from '@deessejs/collections'
```

## Usage

```typescript
import { select } from '@deessejs/collections'

// Simple field selection
const fields = select<User>()(p => [p.id, p.email, p.name])

// Nested path selection
const withRelation = select<Post>()(p => [p.title, p.author.name])

// Usage in findMany
const posts = await config.db.posts.findMany({
  select: select<Post>()(p => [p.id, p.title, p.author.name])
})
```

## Integration with Database

```typescript
import { where, eq, select, orderBy, asc, desc } from '@deessejs/collections'

// Full query with select
const posts = await config.db.posts.findMany({
  where: where(p => [eq(p.published, true)]),
  select: select<Post>()(p => [p.id, p.title, p.author.name]),
  orderBy: orderBy(p => [desc(p.createdAt)]),
  limit: 10
})
```

## Types

```typescript
// Single selection node
interface SelectNode {
  readonly _tag: 'SelectNode'
  readonly path: string[]        // ['author', 'profile', 'name']
  readonly field: string         // 'author.profile.name'
  readonly isRelation: boolean    // Driver detects if path traverses a relation
  readonly isCollection: boolean  // Driver detects if path traverses an array (1:N)
}

// Selection wrapper with phantom types
interface Selection<TEntity, TResult> {
  readonly _tag: 'Selection'
  readonly _entity?: TEntity
  readonly _result?: TResult  // Phantom type for return type inference
  readonly ast: SelectNode[]
}

// Type utility to extract result type
type InferSelection<T> = T extends Selection<unknown, infer R> ? R : never
```

## Why a Builder Pattern for Select?

1. **Type-safe paths** - Refactoring a field name causes TypeScript error
2. **Nested paths** - `p.author.profile.name` works seamlessly via PathProxy
3. **Driver optimization** - AST allows driver to detect JOINs needed
4. **Future extensibility** - Can add computed fields, aliases, aggregations

## Architecture

```
select<User>()(p => [p.author.name])
        │       │   │        │
        │       │   │        └── Terminal: path accumulation
        │       │   └────────── PathProxy: p.author
        │       └────────────── Parameterized builder
        └────────────────────── Curried factory for type inference
```

**Three-tier separation:**
1. **Path Reifier** - Proxy accumulates path via Symbol (shared with `where`, `order-by`)
2. **Select Terminal** - Implicit (no terminal function, just path access)
3. **Selection Wrapper** - `select()` combines nodes into Selection with phantom type

## Limitations

The current implementation:

1. **No automatic 1:N detection** - `isCollection` is `false` until driver schema inspection
2. **No computed fields** - Only path-based selection supported
3. **No aliases** - `p.firstName + p.lastName as fullName` not yet supported

These require integration with the Collection schema to detect relations.

## Files

- `index.ts` - Module exports
- `types.ts` - Type definitions
- `builder.ts` - Functional-applicative implementation
