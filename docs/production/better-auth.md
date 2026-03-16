# Better-Auth Integration

Learn how to integrate Better-Auth with @deessejs/collections.

## Overview

Better-Auth provides authentication (sign up, sign in, sessions, OAuth) while collections provides data modeling and CRUD operations. This document explains how they work together.

## Better-Auth Core Schema

Better-Auth requires the following tables in your database:

| Table | Description |
|-------|-------------|
| `user` | User accounts (id, name, email, image, createdAt, updatedAt) |
| `session` | Active sessions (id, userId, token, expiresAt) |
| `account` | OAuth/credential accounts linked to users |
| `verification` | Email verification tokens |

## Integration Options

### Option 1: Separate Configuration (Recommended)

Better-Auth and collections work independently using the same database connection:

```typescript
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

// 1. Define collections for your app data
const posts = collection({
  slug: 'posts',
  name: 'Posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  }
})

// 2. Create collections config
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts]
})

// 3. Create better-auth instance (separate)
export const auth = betterAuth({
  database: drizzleAdapter(config.db, {
    provider: 'pg'
  }),
  emailAndPassword: { enabled: true }
})
```

### Option 2: Collections as User Model

Use collections to define your user collection and extend better-auth:

```typescript
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'
import { betterAuth } from 'better-auth'

// Define users collection with additional fields
const users = collection({
  slug: 'users',
  name: 'Users',
  fields: {
    name: field({ fieldType: f.text() }),
    email: field({ fieldType: f.email() }),
    role: field({ fieldType: f.select({ options: ['user', 'admin'] }) }),
    bio: field({ fieldType: f.text() })
  }
})

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [users]
})

// Extend better-auth user schema
export const auth = betterAuth({
  database: drizzleAdapter(config.db, { provider: 'pg' }),
  user: {
    additionalFields: {
      role: {
        type: ['user', 'admin'],
        required: false,
        defaultValue: 'user'
      },
      bio: {
        type: 'string',
        required: false
      }
    }
  }
})
```

## Server-Side Usage

### Better-Auth API

```typescript
import { auth } from './auth'
import { headers } from 'next/headers'

// Get current session
const session = await auth.api.getSession({
  headers: await headers()
})

// Sign in
await auth.api.signInEmail({
  body: {
    email: 'user@example.com',
    password: 'password'
  }
})
```

### Collections CRUD

```typescript
import { config } from './config'

const { db } = config

// CRUD on your collections
const posts = await db.posts.findMany({
  where: { published: true }
})

await db.posts.create({
  data: {
    title: 'Hello World',
    content: 'Content here',
    published: true
  }
})
```

## Client-Side Usage

### Better-Auth Client

```typescript
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000'
})

// Sign in
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password'
})

// Get session
const { data: session } = authClient.useSession()
```

## Database Hooks Integration

Map collections hooks to better-auth database hooks:

```typescript
import { betterAuth } from 'better-auth'

export const auth = betterAuth({
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          console.log('User about to be created:', user.email)
          return { data: user }
        },
        after: async (user) => {
          console.log('User created:', user.id)
          // Sync with external service
        }
      },
      delete: {
        before: async (user) => {
          // Prevent deletion of admin users
          if (user.email.includes('admin')) {
            return false
          }
          return true
        }
      }
    }
  }
})
```

## Migration Commands

Generate schema for better-auth:

```bash
npx auth@latest generate
npx auth@latest migrate
```

Generate schema for collections (via Drizzle):

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Summary

| Concern | Better-Auth | Collections |
|---------|-------------|-------------|
| Authentication | ✅ | - |
| Sessions | ✅ | - |
| OAuth | ✅ | - |
| User data CRUD | - | ✅ |
| Custom collections | - | ✅ |
| Hooks | ✅ (databaseHooks) | ✅ |

Both libraries can coexist using the same database connection. Better-Auth handles auth, collections handles your app data.

## Next Steps

- [Quick Start](./quick-start) - Set up collections
- [Field Types](./field-types) - Define your data model
- [Hooks](./hooks) - Add lifecycle logic
