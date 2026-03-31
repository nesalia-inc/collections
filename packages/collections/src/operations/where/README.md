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

Proxy-based DSL with full autocomplete and type-safety. Uses `$` as a terminator to separate path navigation from operator execution (prevents column name collision with operators like `in`, `eq`, `contains`).

### Basic Usage

```typescript
const isPublished = where(p => p.published.$.eq(true))
const isRecent = where(p => p.createdAt.$.gt(new Date('2024-01-01')))

// Compose
const targetPosts = and(isPublished, isRecent)

// Usage
config.db.posts.findMany({ where: targetPosts })
```

### Nested Path Filtering (Relations)

```typescript
// Filter by author.name
const filterByAuthor = where(p => p.author.name.$.eq('John'))

// Filter by nested relations
const filterByLocation = where(p => p.author.profile.location.$.eq('Paris'))
```

### Type-Safe Operators

Operators are specific to field types:

**String fields:**
```typescript
where(p => p.title.$.startsWith('Hello'))
where(p => p.email.$.contains('@gmail.com'))
where(p => p.slug.$.regex('^[a-z]+$'))
```

**Number fields:**
```typescript
where(p => p.age.$.gt(18))
where(p => p.price.$.between(10, 100))
```

**Array fields:**
```typescript
where(p => p.tags.$.has('typescript'))
where(p => p.tags.$.hasAny(['js', 'ts']))
where(p => p.permissions.$.overlaps(['read', 'write']))
```

**All fields:**
```typescript
where(p => p.name.$.eq('John'))
where(p => p.name.$.ne(null))
where(p => p.name.$.in(['a', 'b']))
where(p => p.deletedAt.$.isNull())
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
const p1 = where(p => p.age.$.gt(20))
const p2 = where(p => p.active.$.eq(true))

// Works with predicates
const combined1 = and(p1, p2)

// Works with raw nodes
const combined2 = and(p1.ast, p2.ast)

// Works mixed
const combined3 = and(p1, p2.ast)
```

## Why `$` Terminator?

Using `$` as a terminator prevents collision with column names:

```typescript
// Safe: even if you have a column named 'in' or 'eq'
where<CheckIn>(p => p.in.$.gt(new Date()))
where<Item>(p => p.in.$.eq('value'))
```

## Types

| Type | Description |
|------|-------------|
| `Where<T>` | Object approach type |
| `WhereNode` | AST node union |
| `Predicate<T>` | Functional predicate wrapper |
| `PredicateInput<T>` | Accepts Predicate or WhereNode |
| `FieldOperators<T>` | Type-specific operators |
| `search(fields, value)` | Global search across fields |

## Files

- `index.ts` - Module exports
- `types.ts` - Type definitions
- `builder.ts` - Functional-fluent implementation
