# Update Records

Learn how to update existing records in collections.

## Function Signature

```typescript
update(options: UpdateOperation<T>): AsyncResult<T, UpdateError>

updateMany(options: UpdateManyOperation<T>): AsyncResult<Counted<T[]>, UpdateError>
```

## Type Definitions

```typescript
type UpdateOperation<T> = {
  where: Where
  data: Partial<T>
}

type UpdateManyOperation<T> = {
  where: Where
  data: Partial<T>
}

type Counted<T> = T & { count: number }
```

## update

Update a single record:

```typescript
const result = await config.db.posts.update({
  where: where(p => p.id.eq(1)),
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
  where: where(p => p.published.eq(true)),
  data: { published: false }
})

// result.data = { count: 42 }
```
