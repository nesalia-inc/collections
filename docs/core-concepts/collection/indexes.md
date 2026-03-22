# Indexes

Define database indexes for query performance.

## Overview

Indexes improve query performance on frequently filtered or sorted fields.

## Basic Indexes

```typescript
export const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() }),
    createdAt: field({ fieldType: f.timestamp() })
  },

  indexes: [
    // Single field index
    { fields: ['published'] },

    // Composite index
    { fields: ['published', 'createdAt'] },

    // Unique index
    { fields: ['slug'], unique: true }
  ]
})
```

## Index Options

| Option | Type | Description |
|--------|------|-------------|
| `fields` | `string[]` | Fields to include in the index |
| `unique` | `boolean` | Whether the index is unique |
| `name` | `string` | Custom index name |
| `where` | `object` | Partial index condition |

## Unique Index

Enforce uniqueness on a field:

```typescript
indexes: [
  { fields: ['slug'], unique: true },
  { fields: ['email'], unique: true }
]
```

## Composite Index

Index multiple fields together:

```typescript
indexes: [
  // Index for: WHERE published = true ORDER BY createdAt DESC
  { fields: ['published', 'createdAt'] }
]
```

## Partial Index

Index only a subset of records:

```typescript
indexes: [
  {
    fields: ['userId'],
    where: { deletedAt: null }  // Only index non-deleted records
  }
]
```

## Naming

Custom index names:

```typescript
indexes: [
  {
    fields: ['published', 'createdAt'],
    name: 'idx_posts_published_created'
  }
]
```

## Performance Tips

1. **Index frequently queried fields** - Fields used in WHERE clauses
2. **Index fields used in ORDER BY** - For faster sorting
3. **Use composite indexes wisely** - Order matters (left-to-right)
4. **Avoid over-indexing** - Each index adds write overhead
