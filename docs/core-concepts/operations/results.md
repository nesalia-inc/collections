# Return Values

Understanding how operations return data.

## Paginated Results (find)

The `find` operation returns a `Paginated<T>` type:

```typescript
const result = await config.db.posts.find({
  limit: 10,
  offset: 0
})

// Access data
result.current.data     // T[] - The records
result.current.total    // number - Total count
result.current.limit    // number - Limit used
result.current.offset  // number - Offset used

// Navigation methods
result.hasNext()        // boolean
result.hasPrevious()    // boolean
await result.next()     // Promise<Paginated<T> | null>
await result.previous() // Promise<Paginated<T> | null>
```

## Single Results (findById, findFirst, create, update)

```typescript
const result = await config.db.posts.findById(1)

// result.data = { id: 1, title: 'Post 1', ... }
```

## Count and Write Operations

```typescript
// count
const count = await config.db.posts.count({ where: { published: true } })
// count.data = 42

// createMany, updateMany, deleteMany
const result = await config.db.posts.deleteMany({ where: { published: false } })
// result.data = 10 (number of affected records)
```

## Result Pattern

All operations return a result object with `.data` for success or `.error` for failures:

```typescript
const result = await config.db.posts.findById(1)

if (result.error) {
  console.error(result.error) // Handle error
  return
}

result.data.title // Access data safely
```

This pattern ensures explicit error handling and prevents uncaught exceptions.

## Optional Total Count

The `total` count requires an extra SQL query (`COUNT(*)`), which can be slow on large tables. Disable it for better performance:

```typescript
const result = await config.db.posts.find({
  limit: 10,
  count: false  // Skip COUNT query
})

// result.current.data    // Records
// result.current.total   // undefined (no count performed)
```
