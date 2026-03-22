# Create Records

Learn how to create new records in collections.

## Function Signature

```typescript
// Create a single record
create(options: CreateOperation<T>): AsyncResult<T, CreateError>

// Create multiple records
createMany(options: CreateManyOperation<T>): AsyncResult<Counted<T[]>, CreateError>
```

## Type Definitions

```typescript
type CreateOperation<T> = {
  data: Partial<T>
}

type CreateManyOperation<T> = {
  data: Partial<T>[]
}

type Counted<T> = T & { count: number }
```

Where `T` is the collection type (e.g., `Post`).

## create

Create a single record:

```typescript
const result = await config.db.posts.create({
  data: {
    title: 'My Post',
    content: 'Post content here',
    published: true
  }
})

// result.data = { id: 1, title: 'My Post', ... }
```

## create with relations

Create with related records:

```typescript
const result = await config.db.posts.create({
  data: {
    title: 'My Post',
    content: 'Content',
    author: 'user-123',  // relation ID
    tags: ['tag-1', 'tag-2']  // many relation
  }
})
```

## createMany

Create multiple records:

```typescript
const result = await config.db.posts.createMany({
  data: [
    { title: 'Post 1', published: true },
    { title: 'Post 2', published: false },
    { title: 'Post 3', published: true }
  ]
})

// result.data = 3
```

## Error Handling

All create operations return a `Result<T, Error>` type:

```typescript
const result = await config.db.posts.create({
  data: { title: 'My Post' }
})

if (result.error) {
  console.error(result.error)
  return
}

result.data // Created record
```

### Common Errors

#### Data Already Exists

When a unique constraint is violated:

```typescript
const result = await config.db.posts.create({
  data: { slug: 'my-post' }  // slug might already exist
})

if (result.error?.code === 'ALREADY_EXISTS') {
  // Handle duplicate entry
  console.error('Post with this slug already exists')
}
```

#### Incomplete Data

When required fields are missing:

```typescript
const result = await config.db.posts.create({
  data: {}  // Missing required 'title' field
})

if (result.error?.code === 'INCOMPLETE_DATA') {
  // Handle validation error
  console.error('Missing required fields:', result.error.fields)
}
```
