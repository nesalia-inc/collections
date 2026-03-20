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