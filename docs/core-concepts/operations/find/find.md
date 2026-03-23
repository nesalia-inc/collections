# find

Get all records from a collection (paginated).

```typescript
const result = await config.db.posts.find()

// result.current.data = [{ id: 1, title: 'Post 1', ... }]
// result.current.total = 100
// result.current.limit = 100
// result.current.offset = 0
```

## Options

```typescript
type FindOperation = {
  where?: Where
  select?: Select
  orderBy?: OrderBy
  limit?: number
  offset?: number
  cursor?: CursorOptions
  include?: Include
}
```

## Examples

### With where

```typescript
const result = await config.db.posts.find({
  where: where(p => p.published.eq(true)),
  orderBy: { createdAt: 'desc' },
  limit: 10,
  offset: 0
})
```

### With select

```typescript
const result = await config.db.posts.find({
  select: (p) => ({
    id: p.id,
    title: p.title,
    author: {
      id: p.author.id,
      name: p.author.name
    }
  })
})
```

### With relations

```typescript
const result = await config.db.posts.find({
  include: {
    author: true,
    tags: true
  }
})
```

### Combined where and select

```typescript
const result = await config.db.posts.find({
  where: where(p => p.published.eq(true)),
  select: (p) => ({
    id: p.id,
    title: p.title
  })
})
```

**Note:** Each record in `data` is enriched with instance methods:

```typescript
const { current: { data: posts } } = await db.posts.find()
await Promise.all(posts.map((post) => post.publish()))
```
