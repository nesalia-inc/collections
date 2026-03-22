# Operation Options

Common options used across find, create, update, and delete operations.

## where

Filter conditions:

```typescript
{
  where: {
    // Equal
    published: true,

    // Not equal
    status: { ne: 'draft' },

    // In
    id: { in: [1, 2, 3] },

    // Like (contains)
    title: { like: '%hello%' },

    // Greater than
    createdAt: { gt: '2024-01-01' },

    // Less than
    count: { lt: 10 },

    // Is null
    deletedAt: { isNull: true },

    // Is not null
    deletedAt: { isNotNull: true }
  }
}
```

## orderBy

Sort results:

```typescript
{
  orderBy: { createdAt: 'desc' }
}

// Multiple fields
{
  orderBy: [
    { published: 'desc' },
    { createdAt: 'asc' }
  ]
}
```

## include

Load relations:

```typescript
{
  include: {
    author: true,      // Load author
    tags: true,       // Load tags
    comments: {
      where: { deleted: false },
      limit: 5
    }
  }
}
```

### include (Relations)

The `include` option uses SQL JOINs for efficient data fetching:

```typescript
// Single query with JOINs
const posts = await config.db.posts.find({
  include: {
    author: true,
    comments: true
  }
})

// posts.current.data[0].author is loaded via SQL JOIN
```

**Note:** Include performs SQL JOINs for optimal performance. For complex nested includes, consider using separate queries for better control.

## select

Select specific fields:

```typescript
{
  select: {
    id: true,
    title: true
  }
}
```
