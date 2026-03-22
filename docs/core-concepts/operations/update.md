# Update Records

Learn how to update existing records in collections.

## update

Update a single record:

```typescript
const result = await config.db.posts.update({
  where: { id: 1 },
  data: {
    title: 'Updated Title',
    published: false
  }
})
```

## updateMany

Update multiple records:

```typescript
const result = await config.db.posts.updateMany({
  where: { published: true },
  data: { published: false }
})

// result.data = 42 (number of updated records)
```
