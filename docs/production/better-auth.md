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
│                    Your App                             │
├─────────────────────────────────────────────────────────┤
│  config.db.posts.find()     →  CRUD on posts            │
│  config.db.users.find()    →  Read-only (auth native) │
│  config.auth.api.*         →  Auth API                 │
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
pnpm add better-auth @better-auth/drizzle-adapter
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

### 3. Usage

```typescript
import { config } from './config'
import { headers } from 'next/headers'

// Get current session
const session = await config.auth.api.getSession({
  headers: await headers()
})

// Create post with user relation
const post = await config.db.posts.create({
  data: {
    title: 'My Post',
    content: 'Content here',
    author: session.user.id
  }
})

// Find posts with author
const postsWithAuthors = await config.db.posts.findMany({
  include: { author: true }
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

Your collections create additional tables:

```sql
-- Example schema (auto-generated)
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  -- extended fields
  role TEXT DEFAULT 'user',
  bio TEXT
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  author_id TEXT REFERENCES user(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

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
// actions.ts
import { config } from './config'
import { headers } from 'next/headers'

export async function createPost(formData: FormData) {
  const { user } = await config.auth.api.getSession({ headers: await headers() })

  if (!user) throw new Error('Not authenticated')

  return config.db.posts.create({
    data: {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      published: true,
      author: user.id
    }
  })
}

export async function getPosts() {
  return config.db.posts.findMany({
    include: { author: true }
  })
}

export async function getMyPosts() {
  const { user } = await config.auth.api.getSession({ headers: await headers() })

  return config.db.posts.findMany({
    where: { author: user?.id }
  })
}
```

## Summary

| Feature | Implementation |
|---------|----------------|
| Auth config | `auth: defineAuth({ ... })` |
| Users collection | Built-in (read-only) |
| Extend users | `auth.user.fields` |
| Relations | `f.relation({ to: 'users' })` |
| Auth API | `config.auth.api.*` |

Auth is native to collections, providing seamless integration between your data model and authentication.
