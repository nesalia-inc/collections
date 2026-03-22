# Delete Records

Learn how to delete records from collections.

## delete

Delete a single record:

```typescript
const result = await config.db.posts.delete({
  where: { id: 1 }
})
```

## deleteMany

Delete multiple records:

```typescript
const result = await config.db.posts.deleteMany({
  where: { published: false }
})

// result.data = 10 (number of deleted records)
```
