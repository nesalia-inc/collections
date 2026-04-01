# Select

Type-safe field selection AST builder using an object-based API.

## Public API

```typescript
import { select } from '@deessejs/collections'
```

## Usage

```typescript
import { select } from '@deessejs/collections'

// Simple field selection
const fields = select<User>()(p => ({
  id: p.id,
  name: p.name,
  email: p.email,
}))

// Nested paths with aliases
const withRelation = select<Post>()(p => ({
  id: p.id,
  title: p.title,
  authorName: p.author.name,
}))

// Deep nested objects
const nested = select<User>()(p => ({
  id: p.id,
  profile: {
    bio: p.profile.bio,
    avatar: p.profile.avatar,
  },
}))
```

## Integration with Database

```typescript
import { where, eq, orderBy, asc, desc } from '@deessejs/collections'

// Full query with select - T is naturally inferred from the collection
const posts = await config.db.posts.findMany({
  where: where(p => [eq(p.published, true)]),
  select: (p) => ({
    id: p.id,
    title: p.title,
    authorName: p.author.name,
    createdAt: p.createdAt,
  }),
  orderBy: orderBy(p => [desc(p.createdAt)]),
  limit: 10,
})
```

Note: The `select` option in `findMany` receives `PathProxy<Post>` directly - no need for `select<Post>()` redundancy.

## Types

```typescript
// Single selection node
interface SelectNode {
  readonly _tag: 'SelectNode'
  readonly path: readonly string[]  // ['author', 'profile', 'name']
  readonly field: string           // 'author.profile.name' (DB column)
  readonly alias: string          // 'author.name' (key in result object)
  readonly isRelation: boolean     // Driver detects via schema
  readonly isCollection: boolean   // Driver detects via schema
}

// Selection wrapper with phantom types
interface Selection<TEntity, TResult> {
  readonly _tag: 'Selection'
  readonly _entity?: TEntity
  readonly _result?: Unwrap<TResult>  // Unwrapped primitive types
  readonly ast: SelectNode[]
}

// Type utilities
type Unwrap<T> = T extends PathProxy<infer V> ? V : T
type ValidSelectValue = PathProxy<unknown> | ValidSelectObject
```

## Type Safety

The API uses `ValidSelectValue` constraint for compile-time validation:

```typescript
// Valid - compile-time OK
select<User>()(p => ({ id: p.id, name: p.name }))

// Invalid - compile-time error
select<User>()(p => ({ age: 42 }))  // Error: number is not ValidSelectValue
```

## Nested Objects

Nested objects are supported recursively. The alias always contains the full path from the root:

```typescript
select<User>()(p => ({
  profile: {
    bio: p.profile.bio,
  },
}))

// Results in AST node:
// { field: 'profile.bio', alias: 'profile.bio', ... }
```

This allows the driver to correctly reconstruct nested objects from flat SQL results.

## Architecture

```
select<User>()(p => ({
  id: p.id,
  author: {
    name: p.author.name,
  },
}))
        │       │   │         │
        │       │   │         └── PathProxy for author.name
        │       │   └────────── PathProxy for author
        │       └────────────── Parameterized builder
        └────────────────────── Curried factory for entity type

AST generated:
[
  { field: 'id', alias: 'id', ... },
  { field: 'author.name', alias: 'author.name', ... },
]
```

**Three-tier separation:**
1. **Path Reifier** - Proxy accumulates path via Symbol (shared with `where`, `order-by`)
2. **ValidSelectValue** - Type constraint ensures compile-time validation
3. **collectNodes** - Recursive collection with full-path aliases for nested objects

## Limitations

The following require schema integration:

- `isRelation: true` - Detecting when a path crosses a relation boundary
- `isCollection: true` - Detecting 1:N relationships (arrays)

Currently all paths are marked as `isRelation: false` and `isCollection: false`.

## Files

- `index.ts` - Module exports
- `types.ts` - Type definitions including Unwrap and ValidSelectValue
- `builder.ts` - Builder implementation with recursive node collection
