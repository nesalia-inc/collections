# API Reference

Learn how to expose collections as REST API endpoints with Hono.

## Overview

Collections can be exposed as REST API endpoints. The API follows a consistent pattern:

```
GET    /api/collections/:collection          → List records
GET    /api/collections/:collection/:id     → Get single record
POST   /api/collections/:collection        → Create record
PUT    /api/collections/:collection/:id    → Update record
DELETE /api/collections/:collection/:id    → Delete record
```

## Basic Setup

```typescript
import { Hono } from 'hono'
import { config } from '@/lib/collections'

const app = new Hono()

// Mount collections API
app.route('/api/collections', config.api)

serve(app)
```

## API Structure

### List Records

```http
GET /api/collections/posts?limit=10&offset=0&where[published]=true&include[author]=true
```

Query parameters:
- `limit` - Number of records to return
- `offset` - Pagination offset
- `where[field]` - Filter by field value
- `include[relation]` - Include related records
- `order[field]` - Sort by field
- `order[dir]` - Sort direction (asc/desc)

Response:
```json
{
  "data": [
    {
      "id": 1,
      "title": "My Post",
      "published": true,
      "author": "user-123"
    }
  ],
  "meta": {
    "total": 100,
    "limit": 10,
    "offset": 0
  }
}
```

### Get Single Record

```http
GET /api/collections/posts/1?include[author]=true
```

Response:
```json
{
  "data": {
    "id": 1,
    "title": "My Post",
    "published": true,
    "author": "user-123"
  }
}
```

### Create Record

```http
POST /api/collections/posts
Content-Type: application/json

{
  "title": "New Post",
  "content": "Content here",
  "published": false,
  "author": "user-123"
}
```

Response:
```json
{
  "data": {
    "id": 2,
    "title": "New Post",
    "content": "Content here",
    "published": false,
    "author": "user-123",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update Record

```http
PUT /api/collections/posts/2
Content-Type: application/json

{
  "title": "Updated Title",
  "published": true
}
```

Response:
```json
{
  "data": {
    "id": 2,
    "title": "Updated Title",
    "published": true
  }
}
```

### Delete Record

```http
DELETE /api/collections/posts/2
```

Response:
```json
{
  "data": {
    "id": 2,
    "deleted": true
  }
}
```

## Protected Routes

```typescript
import { Hono } from 'hono'
import { config } from '@/lib/collections'

const app = new Hono<{
  Variables: {
    user: typeof config.auth.$Infer.Session.user | null
  }
}>()

// Middleware to protect routes
app.use('/api/collections/*', async (c, next) => {
  const session = await config.auth.api.getSession({
    headers: c.req.raw.headers
  })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('user', session.user)
  await next()
})

// Protected collections API
app.route('/api/collections', config.api)

serve(app)
```

## Custom Endpoints

You can also create custom endpoints that use collections:

```typescript
import { Hono } from 'hono'
import { config } from '@/lib/collections'

const app = new Hono()

// Custom endpoint: Get posts by current user
app.get('/api/me/posts', async (c) => {
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const posts = await config.db.posts.findMany({
    where: { author: user.id }
  })

  return c.json(posts)
})

// Custom endpoint: Publish/unpublish
app.patch('/api/posts/:id/publish', async (c) => {
  const id = c.req.param('id')
  const { published } = await c.req.json()

  const post = await config.db.posts.update({
    where: { id: parseInt(id) },
    data: { published }
  })

  return c.json(post)
})

serve(app)
```

## Error Handling

```typescript
app.get('/api/collections/posts/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const post = await config.db.posts.findById({ id: parseInt(id) })

    if (!post) {
      return c.json({ error: 'Not found' }, 404)
    }

    return c.json(post)
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})
```

## Validation

Use Zod for request validation:

```typescript
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  published: z.boolean().optional()
})

app.post('/api/collections/posts', async (c) => {
  const body = await c.req.json()

  const result = createPostSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: 'Validation failed', details: result.error }, 400)
  }

  const post = await config.db.posts.create({
    data: result.data
  })

  return c.json(post, 201)
})
```

## Full Example

```typescript
// server.ts
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { config } from '@/lib/collections'
import { z } from 'zod'

const app = new Hono<{
  Variables: {
    user: typeof config.auth.$Infer.Session.user | null
  }
}>()

// CORS
app.use('*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}))

// Auth middleware
app.use('/api/protected/*', async (c, next) => {
  const session = await config.auth.api.getSession({
    headers: c.req.raw.headers
  })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('user', session.user)
  await next()
})

// Auth routes
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return config.auth.handler(c.req.raw)
})

// Public collections
app.route('/api/collections', config.api)

// Protected collections
app.route('/api/protected/collections', config.api)

// Custom protected endpoint
app.get('/api/me/posts', async (c) => {
  const user = c.get('user')

  const posts = await config.db.posts.findMany({
    where: { author: user!.id },
    include: { author: true }
  })

  return c.json(posts)
})

serve(app)
```

## Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collections/:collection` | List records |
| GET | `/api/collections/:collection/:id` | Get single record |
| POST | `/api/collections/:collection` | Create record |
| PUT | `/api/collections/:collection/:id` | Update record |
| DELETE | `/api/collections/:collection/:id` | Delete record |

Use middleware to protect routes based on authentication.
