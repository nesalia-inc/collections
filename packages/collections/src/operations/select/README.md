# Select

Type-safe field selection AST builder.

## Public API

```typescript
import { select } from '@deessejs/collections'
```

## Usage

```typescript
import { select } from '@deessejs/collections'

// Build a selection AST (AST is properly built, return type must be inferred by driver)
const fields = select<User>()(p => [p.id, p.email, p.name])

// Nested paths work
const withRelation = select<Post>()(p => [p.title, p.author.name])
```

## Integration with Database

```typescript
import { where, eq, select, orderBy, asc, desc } from '@deessejs/collections'

// Usage in findMany - driver interprets the AST
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

// Selection wrapper
interface Selection<TEntity, TResult> {
  readonly _tag: 'Selection'
  readonly _entity?: TEntity
  readonly _result?: TResult  // Must be provided manually or by schema
  readonly ast: SelectNode[]
}
```

## Architecture

```
select<User>()(p => [p.id, p.author.name])
        │       │   │         │
        │       │   │         └── Terminal: path accumulation via Proxy
        │       │   └────────── PathProxy: p.author
        │       └────────────── Parameterized builder
        └────────────────────── Curried factory for entity type
```

**Three-tier separation:**
1. **Path Reifier** - Proxy accumulates path via Symbol (shared with `where`, `order-by`)
2. **Select Terminal** - Implicit (field access returns Proxy, no terminal function needed)
3. **Selection Wrapper** - `select()` combines nodes into Selection AST

## Limitations

### Type Inference

This implementation does **NOT** automatically infer the return type as a DeepPick of the selected fields.

```typescript
// What you write:
const result = select<User>()(p => [p.id, p.name])

// What you get (NOT what you might expect):
// Selection<User, unknown> - TResult defaults to unknown

// What you would need for proper inference:
const result = select<User, { id: string; name: string }>()(p => [p.id, p.name])
```

For automatic DeepPick type inference, TypeScript would need to:
1. Track all property accesses through the Proxy
2. Reconstruct the object shape from those paths
3. This is not possible with current TypeScript generics + Proxy pattern

### Alternative Approaches

For better type inference with relations, consider:

**Object-based select (Prisma/Drizzle style):**
```typescript
// More verbose but fully typed
db.posts.findMany({
  select: {
    id: true,
    title: true,
    author: {
      select: { name: true }
    }
  }
})
```

**Manual typing:**
```typescript
const result = select<User, Pick<User, 'id' | 'name'>>()(p => [p.id, p.name])
```

### Schema Integration Required

The following features require integration with Collection schema:

- `isRelation: true` - Detecting when a path crosses a relation boundary
- `isCollection: true` - Detecting 1:N relationships (arrays)
- Automatic JOIN planning based on selection depth

Currently all paths are marked as `isRelation: false` and `isCollection: false`.

## Files

- `index.ts` - Module exports
- `types.ts` - Type definitions
- `builder.ts` - Builder implementation with validation
