# Where Type

Type-safe filtering system with two approaches: **Object** (JSON-like) and **Functional-Applicative** (style Drizzle).

## Public API

```typescript
import { where, and, or, not, eq, gt, contains, search } from '@deessejs/collections'
```

## Object Approach

JSON-like filtering for serialization:

```typescript
{ where: { published: true, status: { ne: 'draft' } } }
```

## Functional-Applicative Approach (Recommended)

Uses the **Applicative Functor** pattern where:
- `p.name` is a pure path (via internal Symbol)
- `eq(p.name, 'John')`, `gt(p.age, 18)` are functions that transform paths into AST nodes

**Zero namespace collision** - you can name columns `in`, `eq`, `contains` without conflict.

### Basic Usage

```typescript
const isPublished = where(p => [eq(p.published, true)])
const isRecent = where(p => [gt(p.createdAt, new Date('2024-01-01'))])

// Compose
const targetPosts = and(isPublished, isRecent)

// Usage
config.db.posts.findMany({ where: targetPosts })
```

### Nested Path Filtering (Relations)

```typescript
// Filter by author.name
const filterByAuthor = where(p => [eq(p.author.name, 'John')])

// Filter by nested relations
const filterByLocation = where(p => [eq(p.author.profile.location, 'Paris')])
```

### Operators

**All fields:**
```typescript
eq(p.name, 'John')
ne(p.name, null)
gt(p.age, 18)
gte(p.price, 10)
lt(p.age, 65)
lte(p.price, 100)
between(p.price, 10, 100)
inList(p.status, ['active', 'pending'])
notInList(p.country, ['US', 'UK'])
isNull(p.deletedAt)
isNotNull(p.publishedAt)
```

**String fields:**
```typescript
like(p.title, '%hello%')
contains(p.email, '@gmail.com')
startsWith(p.slug, 'news-')
endsWith(p.email, '@company.com')
regex(p.code, '^[A-Z]{3}$')
```

**Array fields:**
```typescript
has(p.tags, 'typescript')
hasAny(p.permissions, ['read', 'write'])
overlaps(p.features, ['a', 'b'])
```

### Logical Combinators

```typescript
// AND
const filter = and(predicate1, predicate2, predicate3)

// OR
const filter = or(predicate1, predicate2)

// NOT
const filter = not(predicate1)

// Mixed
const filter = and(
  isPublished,
  or(isRecent, isFeatured)
)
```

### Global Search

Search across multiple text fields:

```typescript
const filter = search(['title', 'content', 'description'], 'typescript')

// Combine with predicates
const filter = and(
  isPublished,
  search(['title', 'content'], 'react')
)
```

## Type Composition

`and`, `or`, `not` accept both `Predicate<T>` and `WhereNode`:

```typescript
const p1 = where(p => [gt(p.age, 20)])
const p2 = where(p => [eq(p.active, true)])

// Works with predicates
const combined1 = and(p1, p2)

// Works with raw nodes
const combined2 = and(p1.ast, p2.ast)

// Works mixed
const combined3 = and(p1, p2.ast)
```

## Why No `$` Terminator?

The `$` was a "technical shortcut" that leaked implementation details. Instead, we use the **Applicative Functor** pattern:

- `p.name` returns a proxy with the path stored via an **internal Symbol**
- Operators are **functions** that extract the path and return AST nodes
- **No namespace pollution** - column names like `in`, `eq`, `contains` are safe

```typescript
// Safe: 'in' is the column, eq is the function
where<Log>(p => [eq(p.in, '2023-01-01')])
```

## Architecture

```
where(p => [eq(p.author.name, 'John')])
        │   │   │      │
        │   │   │      └── Operator function
        │   │   └───────── Path proxy
        │   └───────────── Property access (builds path)
        └───────────────── where() receives PathProxy[]
```

**Three-tier separation:**
1. **Path Reifier** - Proxy accumulates path via Symbol
2. **Operator Terminal** - Functions transform paths to WhereNodes
3. **Boolean Lattice** - and/or/not combine WhereNodes

## Types

| Type | Description |
|------|-------------|
| `Where<T>` | Object approach type |
| `WhereNode` | AST node union (discriminated union) |
| `Predicate<T>` | Functional predicate wrapper |
| `PredicateInput<T>` | Accepts Predicate or WhereNode |

## Files

- `index.ts` - Module exports
- `types.ts` - Type definitions (AST nodes, Where type)
- `builder.ts` - Functional-applicative implementation
