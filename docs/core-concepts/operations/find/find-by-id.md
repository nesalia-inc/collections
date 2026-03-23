# findById

Get a single record by ID.

```typescript
const result = await config.db.posts.findById(1)

// result.data = { id: 1, title: 'Post 1', ... }
```

**Note:** The returned record is enriched with instance methods defined in the collection:

```typescript
const { data: post } = await db.posts.findById(1)
await post.publish()  // Calls the publish instance method if defined
```
