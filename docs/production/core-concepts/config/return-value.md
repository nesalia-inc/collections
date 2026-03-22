# Return Value

`defineConfig` returns a typed config object with collections, database operations, and auth.

## Config Structure

```typescript
const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts, users]
})
```

## Collections API

Access collections metadata and operations:

```typescript
// Metadata (read-only)
config.collections.posts.slug     // 'posts'
config.collections.posts.fields   // { title: FieldDefinition }
config.collections.posts.name     // 'Posts'

// Database operations
config.db.posts.find()
config.db.posts.create()
config.db.posts.update()
config.db.posts.delete()
config.db.posts.findById()

// Extend methods (if defined)
config.db.posts.publish()
config.db.posts.archive()
```

## Database Operations

Each collection gets CRUD methods:

```typescript
// Create
const post = await config.db.posts.create({
  data: { title: 'Hello' }
})

// Read
const posts = await config.db.posts.find({ limit: 10 })

// Update
await config.db.posts.update({
  where: { id: 1 },
  data: { title: 'Updated' }
})

// Delete
await config.db.posts.delete({ where: { id: 1 } })
```

## Extend Methods (Collection-Level)

Collection-level methods defined with `extend` are available directly on the collection:

```typescript
// Assuming posts collection has:
// extend: { publish: async ({ id }, { db }) => {...} }

// Call extend methods on the collection
await config.db.posts.publish({ id: "123" })
await config.db.posts.archive({ id: "456" })
await config.db.posts.setStatus({ id: "789", status: "draft" })
```

## Instance Methods (Record-Level)

Records returned by `find`, `findById`, `findFirst` are enriched with instance methods:

```typescript
// Assuming tasks collection has:
// methods: { complete: async (task) => {...} }

// findById returns enriched record
const { data: task } = await config.db.tasks.findById({ id: "123" })
await task.complete()  // Instance method

// find returns array of enriched records
const { data: tasks } = await config.db.tasks.findMany({})
for (const task of tasks) {
  await task.complete()  // Each record has methods
}
```

## Auth API

If auth is configured:

```typescript
// Session management
config.auth.api.getSession()
config.auth.api.signIn()
config.auth.api.signOut()

// User management
config.auth.api.getUser()
config.auth.api.createUser()
config.auth.api.updateUser()
```

## Handlers

REST API handlers for Next.js/Hono:

```typescript
// Export handlers for API routes
config.handlers  // { GET, POST, PUT, PATCH, DELETE }
```

## Raw Database

Access the underlying Drizzle instance:

```typescript
// Raw queries
config.db.$raw`SELECT * FROM posts`

// Schema access
config.db.$schema.posts
```

## TypeScript

All operations are fully typed:

```typescript
// Collection type inferred
type Post = GetCollectionType<typeof posts>

// Operations typed
await config.db.posts.create({
  data: {
    title: 'Hello'  // string
    // TypeScript ensures only valid fields
  }
})
```