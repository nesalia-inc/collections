# Authentication

Learn how authentication works in @deessejs/collections.

## Overview

Authentication is built into collections. The auth system:
1. Provides a `users` collection (read-only) for user data
2. Handles sessions, OAuth, email/password authentication
3. Enables direct relations from other collections to users
4. Uses Drizzle internally - no separate schema needed

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your App (Hono)                       │
├─────────────────────────────────────────────────────────┤
│  /api/auth/*          →  Auth endpoints                 │
│  /api/collections/*   →  Collections CRUD               │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Drizzle (auto)  │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    PostgreSQL   │
                    └─────────────────┘
```

All tables (users, sessions, accounts, posts, etc.) are managed by the same Drizzle instance.

## Setup

### 1. Install dependencies

```bash
pnpm add better-auth @better-auth/drizzle-adapter hono
```

### 2. Configure auth

```typescript
import { defineConfig, collection, field, f, pgAdapter, defineAuth } from '@deessejs/collections'

// Define your collections
const posts = collection({
  slug: 'posts',
  name: 'Posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})

// Create config with auth
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  auth: defineAuth({
    emailAndPassword: { enabled: true },
    // Extend user with custom fields
    user: {
      fields: {
        role: field({
          fieldType: f.select(['user', 'admin']),
          required: false
        }),
        bio: field({
          fieldType: f.text(),
          required: false
        })
      }
    }
  })
})
```

### 3. Setup Hono Server

```typescript
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { config } from './config'

const app = new Hono()

// CORS for API
app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

// Auth routes
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return config.auth.handler(c.req.raw)
})

// Collections API
app.get('/api/collections/posts', async (c) => {
  const posts = await config.db.posts.findMany({
    include: { author: true }
  })
  return c.json(posts)
})

app.post('/api/collections/posts', async (c) => {
  const body = await c.req.json()
  const post = await config.db.posts.create({
    data: {
      title: body.title,
      content: body.content,
      author: body.authorId
    }
  })
  return c.json(post)
})

serve(app)
```

### 4. Middleware for Protected Routes

```typescript
import { Hono } from 'hono'
import { config } from './config'

const app = new Hono<{
  Variables: {
    user: typeof config.auth.$Infer.Session.user | null
    session: typeof config.auth.$Infer.Session.session | null
  }
}>()

// Auth middleware
app.use('/api/*', async (c, next) => {
  const session = await config.auth.api.getSession({
    headers: c.req.raw.headers
  })

  c.set('user', session?.user ?? null)
  c.set('session', session?.session ?? null)

  await next()
})

// Protected route example
app.get('/api/me/posts', async (c) => {
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const posts = await config.db.posts.findMany({
    where: { author: user.id }
  })

  return c.json(posts)
})
```

## Users Collection

The auth system automatically creates a `users` collection:

```typescript
// Available automatically
config.db.users.find()
config.db.users.findById(userId)

// Fields from auth (always available):
// - id, name, email, emailVerified, image, createdAt, updatedAt

// Extended fields (if configured):
// - role, bio, etc.
```

### Extending Users

```typescript
defineAuth({
  user: {
    fields: {
      role: field({
        fieldType: f.select(['user', 'admin', 'moderator'])
      }),
      bio: field({ fieldType: f.text() }),
      avatar: field({ fieldType: f.text() }),
      settings: field({ fieldType: f.json() })
    }
  }
})
```

## Relations

Use `f.relation()` to link collections to users:

```typescript
// Post has one author
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})

// Comment has one author
const comments = collection({
  slug: 'comments',
  fields: {
    content: field({ fieldType: f.text() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})
```

## Auth API

```typescript
// Sign in
await config.auth.api.signInEmail({
  body: { email, password }
})

// Sign up
await config.auth.api.signUpEmail({
  body: { email, password, name }
})

// Get session
const { user, session } = await config.auth.api.getSession({ headers })

// Sign out
await config.auth.api.signOut({ headers })
```

## OAuth Providers

```typescript
defineAuth({
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  }
})
```

## Database Schema

The auth system creates these tables automatically:

| Table | Description |
|-------|-------------|
| `user` | User accounts (id, name, email, image, createdAt, updatedAt + custom fields) |
| `session` | Active sessions (id, userId, token, expiresAt) |
| `account` | OAuth/credential accounts |
| `verification` | Email verification tokens |

Your collections create additional tables.

## Migrations

```bash
# Generate all schema (auth + collections)
npx auth@latest generate

# Apply migrations
npx auth@latest migrate
```

## Full Example

```typescript
// config.ts
import { defineConfig, collection, field, f, pgAdapter, defineAuth } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  name: 'Posts',
  fields: {
    title: field({ fieldType: f.text() }),
    slug: field({ fieldType: f.text(), unique: true }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})

const tags = collection({
  slug: 'tags',
  name: 'Tags',
  fields: {
    name: field({ fieldType: f.text() }),
    slug: field({ fieldType: f.text(), unique: true })
  }
})

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts, tags],
  auth: defineAuth({
    emailAndPassword: { enabled: true },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!
      }
    },
    user: {
      fields: {
        role: field({
          fieldType: f.select(['user', 'admin']),
          required: false,
          defaultValue: 'user'
        })
      }
    }
  })
})
```

```typescript
// server.ts
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { config } from './config'

const app = new Hono<{
  Variables: {
    user: typeof config.auth.$Infer.Session.user | null
    session: typeof config.auth.$Infer.Session.session | null
  }
}>()

// CORS
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
  c.set('session', session.session)

  await next()
})

// Auth routes
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return config.auth.handler(c.req.raw)
})

// Public routes
app.get('/api/posts', async (c) => {
  const posts = await config.db.posts.findMany({
    where: { published: true },
    include: { author: true }
  })
  return c.json(posts)
})

// Protected routes
app.get('/api/me/posts', async (c) => {
  const user = c.get('user')
  const posts = await config.db.posts.findMany({
    where: { author: user!.id }
  })
  return c.json(posts)
})

app.post('/api/posts', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const post = await config.db.posts.create({
    data: {
      title: body.title,
      content: body.content,
      published: body.published ?? false,
      author: user!.id
    }
  })

  return c.json(post, 201)
})

serve(app)
```

```typescript
// client.ts
import { hc } from 'hono/client'
import type { AppType } from './server'

const client = hc<AppType>('http://localhost:3000', {
  init: {
    credentials: 'include',
  },
})

// Sign in
await client.api.auth.signIn.email.post({
  email: 'user@example.com',
  password: 'password'
})

// Get posts
const posts = await client.api.posts.$get()

// Create post (authenticated)
await client.api.posts.post({
  title: 'My Post',
  content: 'Content here'
})
```

## Summary

| Feature | Implementation |
|---------|----------------|
| Auth config | `auth: defineAuth({ ... })` |
| Users collection | Built-in (read-only) |
| Extend users | `auth.user.fields` |
| Relations | `f.relation({ to: 'users' })` |
| Server | Hono |
| Auth API | `config.auth.api.*` |

Auth is native to collections, providing seamless integration between your data model and authentication.
