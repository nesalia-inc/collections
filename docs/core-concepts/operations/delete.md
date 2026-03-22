# Delete Records

Learn how to delete records from collections.

## Function Signature

```typescript
// Delete a single record
delete(options: DeleteOperation): AsyncResult<void, DeleteError>

// Delete multiple records
deleteMany(options: DeleteManyOperation): AsyncResult<Counted<T[]>, DeleteError>
```

## Type Definitions

```typescript
type DeleteOperation = {
  where: Where
}

type DeleteManyOperation = {
  where: Where
}
```

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

// result.data = { data: [...], count: 10 }
```
