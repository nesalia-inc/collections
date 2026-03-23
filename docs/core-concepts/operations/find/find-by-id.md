# findById

Get a single record by ID.

## Function Signature

```typescript
findById(options: FindByIdOperation): AsyncResult<T, FindByIdError>
```

## Type Definition

```typescript
type FindByIdOperation = {
  id: ID
  select?: Select
  include?: Include
}
```

## Examples

### By ID

```typescript
const result = await config.db.posts.findById({
  id: 1
})

// result.data = { id: 1 title: 'Post 1', ... }
```

### With select

```typescript
const result = await config.db.posts.findById({
  id: 1,
  select: (p) => ({
    id: p.id,
    title: p.title
  })
})

// result.data = { id: 1, title: 'Post 1' }
```

### With nested relations

```typescript
const result = await config.db.posts.findById({
  id: 1,
  select: (p) => ({
    id: p.id,
    title: p.title,
    author: {
      id: p.author.id,
      name: p.author.name,
      profile: {
        avatar: p.author.profile.avatar
      }
    }
  })
})
```

**Note:** The returned record is enriched with instance methods defined in the collection:

```typescript
const { data: post } = await db.posts.findById({ id: 1 })
await post.publish()  // Calls the publish instance method if defined
```
