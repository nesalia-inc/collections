# Next.js Integration

Learn how to integrate @deessejs/collections with Next.js App Router.

## Overview

Collections provides a seamless Next.js integration with:
- Built-in route handlers for auth and collections
- Type-safe API routes
- Server Actions support
- Middleware for protected routes

## Project Structure

```
app/
├── (deesse)/
│   └── api/
│       └── [...route]/
│           └── route.ts    # All API routes handled internally
└── ...
```

## Setup

### 1. Install dependencies

```bash
pnpm add @deessejs/collections better-auth @better-auth/drizzle-adapter
```

### 2. Configure

```typescript
// lib/config.ts
import { defineConfig, collection, field, f, pgAdapter, defineAuth } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  name: 'Posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  auth: defineAuth({
    emailAndPassword: { enabled: true }
  })
})
```

### 3. Create API Route Handler

All API routes are handled automatically:

```typescript
// app/(deesse)/api/[...route]/route.ts
/* THIS FILE WAS GENERATED AUTOMATICALLY BY COLLECTIONS. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { config } from '@deessejs/collections/config'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@deessejs/collections/next'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
```

That's it! All routes are automatically handled:

| Method | Route | Handler |
|--------|-------|---------|
| GET/POST | `/api/auth/*` | Better-Auth |
| GET | `/api/collections/:collection` | List records |
| GET | `/api/collections/:collection/:id` | Get record |
| POST | `/api/collections/:collection` | Create record |
| PUT/PATCH | `/api/collections/:collection/:id` | Update record |
| DELETE | `/api/collections/:collection/:id` | Delete record |

### 4. Use in Server Actions

```typescript
// actions/posts.ts
'use server'

import { config } from '@/lib/config'
import { headers } from 'next/headers'

export async function getPosts() {
  return config.db.posts.findMany({
    where: { published: true },
    include: { author: true }
  })
}

export async function getPost(id: number) {
  return config.db.posts.findById({ id })
}

export async function createPost(formData: FormData) {
  const session = await config.auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    throw new Error('Not authenticated')
  }

  return config.db.posts.create({
    data: {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      published: false,
      author: session.user.id
    }
  })
}

export async function updatePost(id: number, data: Partial<{ title: string; content: string; published: boolean }>) {
  return config.db.posts.update({
    where: { id },
    data
  })
}

export async function deletePost(id: number) {
  return config.db.posts.delete({ where: { id } })
}
```

### 5. Use in Components

```typescript
// app/(deesse)/posts/page.tsx
import { getPosts } from '@/actions/posts'

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <ul>
      {posts.data.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

## Client-Side Usage

### Auth Client

```typescript
// lib/auth-client.ts
'use client'

import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient()
```

```typescript
// components/sign-in-button.tsx
'use client'

import { authClient } from '@/lib/auth-client'

export function SignInButton() {
  return (
    <button
      onClick={() =>
        authClient.signIn.email({
          email: 'user@example.com',
          password: 'password'
        })
      }
    >
      Sign In
    </button>
  )
}
```

### API Client

```typescript
// lib/api.ts
import { createClient, type AutoRetryOptions } from 'better-fetch'

export function apiClient(baseUrl: string = '') {
  return createClient({
    baseUrl,
    options: {
      onError: (error) => {
        console.error('API Error:', error)
      }
    } as AutoRetryOptions
  })
}
```

```typescript
// components/post-list.tsx
'use client'

import { apiClient } from '@/lib/api'

async function fetchPosts() {
  const response = await apiClient().fetch('/api/collections/posts', {
    method: 'GET'
  })
  return response.json()
}
```

## Middleware

Protect routes with middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { config } from '@/lib/config'

export async function middleware(request: NextRequest) {
  const session = await config.auth.api.getSession({
    headers: request.headers
  })

  // Protected paths
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    // Check role
    if (session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
```

## Extended Example

```typescript
// lib/config.ts
import { defineConfig, collection, field, f, pgAdapter, defineAuth } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
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

const comments = collection({
  slug: 'comments',
  fields: {
    content: field({ fieldType: f.text() }),
    postId: field({ fieldType: f.relation({ to: 'posts' }) }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts, comments],
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
// app/(deesse)/api/[...route]/route.ts
import { NextRequest } from 'next/server'
import { config } from '@/lib/config'

import { config } from '@deessejs/collections/config'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@deessejs/collections/next'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
```

```typescript
// actions/posts.ts
'use server'

import { config } from '@/lib/config'
import { headers } from 'next/headers'

export async function getPosts() {
  return config.db.posts.findMany({
    where: { published: true },
    include: { author: true }
  })
}

export async function getMyPosts() {
  const session = await config.auth.api.getSession({
    headers: await headers()
  })

  if (!session) return { data: [], meta: { total: 0 } }

  return config.db.posts.findMany({
    where: { author: session.user.id },
    include: { author: true }
  })
}

export async function createPost(data: {
  title: string
  content: string
  published: boolean
}) {
  const session = await config.auth.api.getSession({
    headers: await headers()
  })

  if (!session) throw new Error('Not authenticated')

  return config.db.posts.create({
    data: {
      ...data,
      author: session.user.id
    }
  })
}
```

```typescript
// app/(deesse)/posts/page.tsx
import { getPosts } from '@/actions/posts'

export default async function PostsPage() {
  const { data: posts } = await getPosts()

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <span>By {post.author?.name}</span>
        </article>
      ))}
    </div>
  )
}
```

## Summary

| Feature | Implementation |
|---------|----------------|
| API Handler | `REST_GET`, `REST_POST`, etc. from `@deessejs/collections/next` |
| Route File | `app/(deesse)/api/[...route]/route.ts` |
| Server Actions | Use `config.db` + `config.auth.api` |
| Client Auth | `createAuthClient()` from better-auth |
| Middleware | Check `config.auth.api.getSession()` |

All exports are handled internally - just export `GET`, `POST`, etc. from the route file.
