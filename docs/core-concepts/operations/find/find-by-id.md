# findById

Get a single record by ID.

## Function Signature

```typescript
findById(id: { id: ID }, options?: FindByIdOperation): AsyncResult<T, FindByIdError>
```

## Type Definition

```typescript
type FindByIdOperation = {
  select?: Select
  include?: Include
}
```

## Examples

### By ID

```typescript
const result = await config.db.posts.findById({ id: 1 })

// result.data = { id: 1, title: 'Post 1', ... }
```

### With select

```typescript
const result = await config.db.posts.findById({ id: 1 }, {
  select: ['id', 'title']
})

// result.data = { id: 1, title: 'Post 1' }
```

**Note:** The returned record is enriched with instance methods defined in the collection:

```typescript
const { data: post } = await db.posts.findById({ id: 1 })
await post.publish()  // Calls the publish instance method if defined
```
