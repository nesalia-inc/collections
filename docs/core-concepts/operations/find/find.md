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
  orderBy?: OrderBy
  limit?: number
  offset?: number
  cursor?: CursorOptions
  include?: Include
}
```

## Examples

### With filters

```typescript
const result = await config.db.posts.find({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  limit: 10,
  offset: 0
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

**Note:** Each record in `data` is enriched with instance methods:

```typescript
const { data: posts } = await db.posts.find({ where: { published: true } })
await Promise.all(posts.map((post) => post.publish()))
```
