# count

Count records matching conditions.

```typescript
const result = await config.db.posts.count({
  where: { published: true }
})

// result.data = 42
```
