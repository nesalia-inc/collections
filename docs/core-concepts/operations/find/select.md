# Select

The `select` option allows you to specify which fields to return from a query, improving performance by reducing data transfer.

## Function Signature

```typescript
type Select = Field[]
```

## Basic Usage

```typescript
// Select only specific fields
const result = await config.db.posts.find({
  select: ['id', 'title', 'slug']
})

// result.current.data = [{ id: 1, title: 'Post 1', slug: 'post-1' }]
```

## With findById

```typescript
const result = await config.db.posts.findById({
  id: 1,
  select: ['id', 'title']
})

// result.data = { id: 1, title: 'Post 1' }
```

## With Nested Relations

Select fields from related collections:

```typescript
const result = await config.db.posts.find({
  select: ['id', 'title', 'author.id', 'author.name']
})
```

## Exclude Fields

Use `-` prefix to exclude specific fields:

```typescript
// Get all fields except content
const result = await config.db.posts.find({
  select: ['-content']
})
```

## Notes

- If `select` is not provided, all fields are returned by default
- The `id` field is always included even if not explicitly selected
- Selecting only required fields improves query performance
- Works with all find operations (find, findFirst, findById)
