# Next.js Integration

Learn how to integrate @deessejs/collections with Next.js.

## Installation

```bash
pnpm add @deessejs/collections @deessejs/collections-next
```

## Quick Setup

### 1. Configure Collections

```typescript
// src/lib/collections.ts
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  }
})

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts]
})
```

### 2. Add to Next.js Config

```typescript
// next.config.mjs
import { withCollections } from '@deessejs/collections-next'

export default withCollections({
  // Your Next.js config
})
```

### 3. Create API Route

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
} from '@deessejs/collections-next'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
```

## Automatic Schema Sync

In development, the plugin automatically syncs your schema when you modify `src/lib/collections.ts`:

```typescript
// src/lib/collections.ts
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),  // ADD THIS
  }
})
```

When you save, the plugin automatically:
1. Detects the change
2. Generates updated schema
3. Pushes to database
4. Shows notification in console

## Configuration

```typescript
// next.config.mjs
import { withCollections } from '@deessejs/collections-next'

export default withCollections({
  // Your Next.js config
}, {
  // Collections options
  autoPush: true,        // Auto-push on changes (default: true in dev)
  verbose: true,         // Show detailed output
  watchPath: './src/lib/collections.ts'  // Config path
})
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoPush` | boolean | `true` (dev) | Auto-push schema on changes |
| `verbose` | boolean | `false` | Show detailed output |
| `watchPath` | string | `./src/lib/collections.ts` | Path to collections config |

## API Routes

### Collections CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collections/:collection` | List records |
| GET | `/api/collections/:collection/:id` | Get record |
| POST | `/api/collections/:collection` | Create record |
| PUT | `/api/collections/:collection/:id` | Update record |
| DELETE | `/api/collections/:collection/:id` | Delete record |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/auth/*` | Auth endpoints |

## Server Actions

```typescript
// actions/posts.ts
'use server'

import { config } from '@/lib/collections'
import { headers } from 'next/headers'

export async function getPosts() {
  return config.db.posts.findMany({
    where: { published: true }
  })
}

export async function createPost(data: {
  title: string
  content: string
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

## Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { config } from '@/lib/collections'

export async function middleware(request: NextRequest) {
  const session = await config.auth.api.getSession({
    headers: request.headers
  })

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
```

## Production Build

For production, use the CLI:

```bash
# Build your app
npm run build

# Push schema to database
npx @deessejs/collections-cli push
```

The `withCollections` plugin is automatically disabled in production.

## Project Structure

```
my-app/
├── src/
│   └── lib/
│       └── collections.ts    # Collections config
├── app/
│   └── (deesse)/
│       └── api/
│           └── [...route]/
│               └── route.ts  # API handler
├── next.config.mjs          # withCollections config
└── package.json
```

## Summary

| Feature | Implementation |
|---------|----------------|
| Config | `src/lib/collections.ts` |
| Next.js plugin | `withCollections()` in next.config.mjs |
| API Handler | REST_* from `@deessejs/collections-next` |
| Auto-push | In development only |
| Production | Use CLI: `npx @deessejs/collections-cli push` |
