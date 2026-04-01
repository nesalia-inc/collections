# Order-by

Type-safe ordering system using the **Functional-Applicative** pattern, similar to `where`.

## Public API

```typescript
import { orderBy, asc, desc } from '@deessejs/collections'
```

## Usage

```typescript
import { orderBy, asc, desc } from '@deessejs/collections'

// Single field ordering
const byDate = orderBy(p => [desc(p.createdAt)])

// Multi-criteria ordering
const byStatusAndDate = orderBy(p => [
  asc(p.status),
  desc(p.createdAt)
])

// Nested path support
const byAuthorName = orderBy(p => [asc(p.author.name)])
```

## Integration with Database

```typescript
import { where, eq, orderBy, asc, desc } from '@deessejs/collections'

// Find posts ordered by status and date
const posts = await config.db.posts.findMany({
  where: where(p => [eq(p.published, true)]),
  orderBy: orderBy(p => [
    asc(p.status),
    desc(p.createdAt)
  ]),
  limit: 10
})
```

## Operators

| Operator | Description |
|----------|-------------|
| `asc` | Sort in ascending order |
| `desc` | Sort in descending order |

## Why a Builder Pattern?

Unlike simple object-based ordering like `{ status: 'asc', createdAt: 'desc' }`, the builder pattern:

1. **Guarantees key order** - Array order is preserved in all JS engines
2. **Type safety** - Refactoring a field name will cause a TypeScript error
3. **Nested paths** - `p.author.name` works seamlessly via PathProxy
4. **Validation** - Runtime error if you forget `asc()` or `desc()`

## Types

```typescript
// Direction
type OrderDirection = 'asc' | 'desc'

// Single ordering node
interface OrderNode {
  readonly _tag: 'OrderNode'
  readonly field: string
  readonly direction: OrderDirection
}

// Wrapper returned by orderBy()
interface OrderBy<T> {
  readonly _tag: 'OrderBy'
  readonly _entity: T
  readonly ast: OrderNode[]
}

// Input can be OrderBy, single OrderNode, or array
type OrderInput<T> = OrderBy<T> | OrderNode | OrderNode[]
```

## Architecture

```
orderBy(p => [desc(p.author.name)])
        │   │   │       │
        │   │   │       └── Terminal: desc()
        │   │   └────────── PathProxy: p.author.name
        │   └────────────── Property access
        └────────────────── orderBy() receives OrderNode[]
```

**Three-tier separation:**
1. **Path Reifier** - Proxy accumulates path via Symbol (shared with `where`)
2. **Order Terminal** - `asc()`/`desc()` functions transform paths to OrderNodes
3. **Order Wrapper** - `orderBy()` combines nodes into OrderBy<T>

## Files

- `index.ts` - Module exports
- `types.ts` - Type definitions
- `builder.ts` - Functional-applicative implementation
