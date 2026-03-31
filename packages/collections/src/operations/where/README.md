# Where Type

Type-safe filtering system with two approaches: **Object** (JSON-like) and **Functional-Fluent** (Proxy-based).

## Public API

```typescript
import { where, and, or, not, eq, gt, lt, contains } from '@deessejs/collections'
```

## Object Approach

JSON-like filtering for serialization:

```typescript
{ where: { published: true, status: { ne: 'draft' } } }
```

## Functional-Fluent Approach (Recommended)

Proxy-based DSL for type-safe, composable filters:

```typescript
const isPublished = where(p => p.published.eq(true))
const isRecent = where(p => p.createdAt.gt(new Date('2024-01-01')))

// Compose
const targetPosts = and(isPublished.ast, isRecent.ast)

// Usage
config.db.posts.findMany({ where: isPublished })
```

### Operators

```typescript
where(p => p.field.eq(value))      // Equal
where(p => p.field.ne(value))      // Not equal
where(p => p.field.gt(value))     // Greater than
where(p => p.field.gte(value))    // Greater than or equal
where(p => p.field.lt(value))     // Less than
where(p => p.field.lte(value))    // Less than or equal
where(p => p.field.contains(value)) // String contains
where(p => p.field.startsWith(value)) // String starts with
where(p => p.field.endsWith(value))   // String ends with
where(p => p.field.in([a, b]))    // In array
where(p => p.field.isNull())      // Is null
where(p => p.field.isNotNull())   // Is not null
```

### Logical Combinators

```typescript
and(node1, node2, ...)   // AND all
or(node1, node2, ...)     // OR all
not(node)                 // NOT
```

## Types

| Type | Description |
|------|-------------|
| `Where<T>` | Object approach type |
| `WhereNode` | AST node type |
| `Predicate<T>` | Functional predicate wrapper |

## Files

- `index.ts` - Module exports
- `types.ts` - Type definitions
- `builder.ts` - Functional-fluent implementation
