# Create Records

Learn how to create new records in collections.

## create

Create a single record:

```typescript
const result = await config.db.posts.create({
  data: {
    title: 'My Post',
    content: 'Post content here',
    published: true
  }
})

// result.data = { id: 1, title: 'My Post', ... }
```

## create with relations

Create with related records:

```typescript
const result = await config.db.posts.create({
  data: {
    title: 'My Post',
    content: 'Content',
    author: 'user-123',  // relation ID
    tags: ['tag-1', 'tag-2']  // many relation
  }
})
```

## createMany

Create multiple records:

```typescript
const result = await config.db.posts.createMany({
  data: [
    { title: 'Post 1', published: true },
    { title: 'Post 2', published: false },
    { title: 'Post 3', published: true }
  ]
})

// result.data = 3
```
