# Transactions

Execute multiple operations atomically using transactions.

## Basic Transaction

```typescript
await config.db.$transaction(async (tx) => {
  // tx provides the same API as config.db.posts
  const post = await tx.posts.create({
    data: { title: 'New Post' }
  })

  await tx.tags.create({
    data: { name: 'featured', postId: post.data.id }
  })

  // If either fails, both are rolled back
})
```

## Transaction Return Values

Operations inside a transaction return data directly (not wrapped):

```typescript
await config.db.$transaction(async (tx) => {
  const post = await tx.posts.create({
    data: { title: 'New Post' }
  })

  // post.data is available directly
  return post.data.id
})
```
