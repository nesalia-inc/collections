# exists

Check if a record exists.

```typescript
const result = await config.db.posts.exists({
  where: { slug: 'my-post' }
})

// result.data = true
```
