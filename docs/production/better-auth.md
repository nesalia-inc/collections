# Better-Auth Integration

Learn how to integrate Better-Auth with @deessejs/collections.

## Overview

Better-Auth is integrated as a plugin. The plugin:
1. Creates a read-only `user` collection (maps to better-auth's user table)
2. Allows extending the user collection with additional fields
3. Enables relations from other collections to users

## Architecture

```
config.defineConfig({
  plugins: [betterAuthPlugin({ ... })],  // Adds user collection
  collections: [posts, comments]           // Your custom collections
})
```

```
┌─────────────────────────────────────────────────────────┐
│                    Your App                             │
├─────────────────────────────────────────────────────────┤
│  config.db.posts.find()     →  CRUD on posts            │
│  config.db.users.find()    →  Read-only (from plugin) │
│  config.auth.api.*         →  Better-Auth API           │
└─────────────────────────────────────────────────────────┘
```

## Setup

### 1. Install dependencies

```bash
pnpm add better-auth @better-auth/drizzle-adapter
```

### 2. Configure with plugin

```typescript
import { defineConfig, collection, field, f, pgAdapter, betterAuthPlugin } from '@deessejs/collections'

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

// Create config with better-auth plugin
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  plugins: [
    betterAuthPlugin({
      emailAndPassword: { enabled: true },
      // Extend the user collection with custom fields
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
  ]
})
```

### 3. Usage

```typescript
import { config, auth } from './config'
import { headers } from 'next/headers'

// Get current session
const session = await auth.api.getSession({
  headers: await headers()
})

// Create post with user relation
const post = await config.db.posts.create({
  data: {
    title: 'My Post',
    content: 'Content here',
    author: session.user.id  // Use better-auth user ID
  }
})

// Find posts with author
const postsWithAuthors = await config.db.posts.findMany({
  include: { author: true }
})
```

## User Collection

The `betterAuthPlugin` automatically adds a `users` collection:

```typescript
// Available automatically after adding plugin
config.db.users.find()
config.db.users.findById(userId)

// Fields from better-auth (always available):
// - id, name, email, emailVerified, image, createdAt, updatedAt

// Extended fields (if configured):
// - role, bio, etc.
```

### Extending User Collection

```typescript
betterAuthPlugin({
  user: {
    fields: {
      // Add custom fields
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
// Post has one author (user)
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})

// Comment has one author (user)
const comments = collection({
  slug: 'comments',
  fields: {
    content: field({ fieldType: f.text() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})

// User has many posts
const users = collection({
  slug: 'users',
  // This collection is extended from better-auth
  fields: {
    // ... extended fields
    posts: field({
      fieldType: f.relation({ to: 'posts', many: true })
    })
  }
})
```

## API Access

Better-Auth API is available via the `auth` instance:

```typescript
import { auth } from '@deessejs/collections/auth'

// Server-side API calls
await auth.api.signInEmail({
  body: { email, password }
})

await auth.api.getSession({ headers })

await auth.api.signOut({ headers })
```

## Migrations

```bash
# Generate better-auth schema (includes extended fields)
npx auth@latest generate

# Apply migrations
npx auth@latest migrate

# Collections schema is auto-generated
```

## Full Example

```typescript
// config.ts
import { defineConfig, collection, field, f, pgAdapter, betterAuthPlugin } from '@deessejs/collections'

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
    }),
    tags: field({
      fieldType: f.relation({ to: 'tags', many: true })
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
  plugins: [
    betterAuthPlugin({
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
  ]
})

export const { auth } = config.auth
```

```typescript
// actions.ts
import { config, auth } from './config'
import { headers } from 'next/headers'

export async function createPost(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) throw new Error('Not authenticated')

  return config.db.posts.create({
    data: {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      published: true,
      author: session.user.id
    }
  })
}

export async function getPosts() {
  return config.db.posts.findMany({
    include: { author: true }
  })
}

export async function getMyPosts() {
  const session = await auth.api.getSession({ headers: await headers() })

  return config.db.posts.findMany({
    where: { author: session?.user.id }
  })
}
```

## Summary

| Feature | Implementation |
|---------|----------------|
| Authentication | `betterAuthPlugin()` |
| User collection | Added by plugin (read-only) |
| Extend user | `user.fields` in plugin config |
| Relations | `f.relation({ to: 'users' })` |
| Auth API | `config.auth.api.*` |

The plugin approach keeps concerns separated while making the user collection available for relations.
