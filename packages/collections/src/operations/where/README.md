# Where Type

Type-safe filtering system with two approaches: **Object** (JSON-like) and **Functional-Fluent** (Proxy-based).

## Public API

```typescript
import { where, and, or, not, search } from '@deessejs/collections'
```

## Object Approach

JSON-like filtering for serialization:

```typescript
{ where: { published: true, status: { ne: 'draft' } } }
```

## Functional-Fluent Approach (Recommended)

Proxy-based DSL for type-safe, composable filters with full autocomplete.

### Basic Usage

```typescript
const isPublished = where(p => p.published.eq(true))
const isRecent = where(p => p.createdAt.gt(new Date('2024-01-01')))

// Compose - predicates can be passed directly
const targetPosts = and(isPublished, isRecent)

// Usage
config.db.posts.findMany({ where: targetPosts })
```

### Nested Path Filtering (Relations)

The Proxy supports nested paths for relation filtering:

```typescript
// Filter by author.name
const filterByAuthor = where(p => p.author.name.eq('John'))

// Filter by nested relations
const filterByLocation = where(p => p.author.profile.location.eq('Paris'))
```

### Operators

```typescript
where(p => p.field.eq(value))        // Equal (supports null)
where(p => p.field.ne(value))        // Not equal (supports null)
where(p => p.field.gt(value))        // Greater than
where(p => p.field.gte(value))       // Greater than or equal
where(p => p.field.lt(value))        // Less than
where(p => p.field.lte(value))       // Less than or equal
where(p => p.field.between(min, max)) // Between
where(p => p.field.in([a, b]))       // In array
where(p => p.field.notIn([a, b]))    // Not in array
where(p => p.field.isNull())         // Is null
where(p => p.field.isNotNull())      // Is not null
where(p => p.field.contains(value))   // String contains
where(p => p.field.startsWith(value)) // String starts with
where(p => p.field.endsWith(value))   // String ends with
where(p => p.field.like(value))      // SQL LIKE pattern
where(p => p.field.regex(value))     // Regular expression
```

### Logical Combinators

```typescript
// AND - combine multiple predicates
const filter = and(predicate1, predicate2, predicate3)

// OR - alternative conditions
const filter = or(predicate1, predicate2)

// NOT - negate a predicate
const filter = not(predicate1)

// Mixed composition
const filter = and(
  isPublished,
  or(isRecent, isFeatured)
)
```

### Global Search

Search across multiple text fields:

```typescript
// Explicit fields list (avoids column name collision)
const filter = search(['title', 'content', 'description'], 'typescript')

// Combine with other predicates
const filter = and(
  isPublished,
  search(['title', 'content'], 'react')
)
```

## Type Composition

The `and`, `or`, `not` functions accept both `Predicate<T>` and `WhereNode`:

```typescript
const p1 = where(p => p.age.gt(20))
const p2 = where(p => p.active.eq(true))

// Works with predicates
const combined1 = and(p1, p2)

// Works with raw nodes
const combined2 = and(p1.ast, p2.ast)

// Works mixed
const combined3 = and(p1, p2.ast)
```

## Types

| Type | Description |
|------|-------------|
| `Where<T>` | Object approach type |
| `WhereNode` | AST node type |
| `Predicate<T>` | Functional predicate wrapper |
| `PredicateInput<T>` | Accepts Predicate or WhereNode |
| `search(fields, value)` | Global search across fields |

## Files

- `index.ts` - Module exports
- `types.ts` - Type definitions
- `builder.ts` - Functional-fluent implementation
