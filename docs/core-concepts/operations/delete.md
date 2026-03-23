# Delete Records

Learn how to delete records from collections.

## Function Signature

```typescript
// Delete a record by ID
deleteById(id: ID): AsyncResult<T, DeleteError>

// Delete the first matching record
deleteFirst(options: DeleteOperation): AsyncResult<T, DeleteError>

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
  limit?: number
}
```

## deleteById

Delete a single record by its ID:

```typescript
const result = await config.db.posts.deleteById(1)
```

## deleteFirst

Delete the first record matching the where condition:

```typescript
const result = await config.db.posts.deleteFirst({
  where: { status: 'draft', createdAt: { lt: '2024-01-01' } }
})
```

## deleteMany

Delete records matching the where condition, with optional limit:

```typescript
const result = await config.db.posts.deleteMany({
  where: { published: false },
  limit: 100
})

// result.data = { data: [...], count: 10 }
```