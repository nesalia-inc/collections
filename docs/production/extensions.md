# Extensions

Learn about the Extension system in Collections - a powerful way to add predefined capabilities to your application.

## Overview

Extensions are like plugins but with a **predefined interface**. While plugins can add arbitrary capabilities, extensions provide a standardized contract that any provider can implement.

Think of it like a specification:

```
┌─────────────────────────────────────────────────────────────┐
│                      Extension                                │
├─────────────────────────────────────────────────────────────┤
│  - Defined interface (what it must provide)                 │
│  - Multiple implementations (connectors)                    │
│  - Consistent API for the developer                        │
└─────────────────────────────────────────────────────────────┘
```

## Why Extensions?

### Plugins vs Extensions

| Aspect | Plugin | Extension |
|--------|--------|-----------|
| Interface | Custom per plugin | Predefined by Collections |
| Connectors | N/A | Multiple per extension |
| Swap implementation | Requires code change | Just change connector |
| Type safety | Custom types | Standardized types |

### The Extension Contract

An extension defines:
1. **Required properties** - What the extension must provide
2. **Optional properties** - What can be customized
3. **Connector interface** - How providers implement it

## Available Extensions

### Auth Extension

The auth extension provides authentication:

```typescript
import { defineConfig, betterAuth } from '@deessejs/collections'

const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  auth: betterAuth({
    emailAndPassword: { enabled: true }
  })
})
```

**Built-in connector:** Better-Auth
**External connectors:** Clerk, Supabase, Auth0

### Cache Extension

The cache extension provides caching:

```typescript
import { defineConfig, redisCache } from '@deessejs/collections'

const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  cache: redisCache({
    url: process.env.REDIS_URL!
  })
})
```

**Connectors:**
- `redisCache()` - Redis adapter
- `memCache()` - In-memory cache
- `fileCache()` - File-based cache
- `noCache()` - Disabled cache

### Email Extension

The email extension provides email sending:

```typescript
import { defineConfig, sendGridEmail } from '@deessejs/collections'

const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  email: sendGridEmail({
    apiKey: process.env.SENDGRID_API_KEY!
  })
})
```

**Connectors:**
- `sendGridEmail()` - SendGrid
- `resendEmail()` - Resend
- `smtpEmail()` - SMTP
- `consoleEmail()` - Development (logs to console)

### Storage Extension

The storage extension provides file storage:

```typescript
import { defineConfig, s3Storage } from '@deessejs/collections'

const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  storage: s3Storage({
    bucket: process.env.AWS_BUCKET!,
    region: process.env.AWS_REGION!
  })
})
```

**Connectors:**
- `s3Storage()` - AWS S3
- `gcsStorage()` - Google Cloud Storage
- `azureStorage()` - Azure Blob Storage
- `localStorage()` - Local filesystem

## Extension Interface

Each extension has a standardized interface:

```typescript
interface Extension<
  Config extends Record<string, any>,
  Api extends Record<string, any>
> {
  readonly name: string
  readonly config: Config
  readonly api: Api
  readonly hooks?: HooksConfig
  readonly virtualCollections?: Collection[]
}

// Example: Cache extension
interface CacheExtension {
  readonly name: 'cache'
  readonly config: {
    ttl: number
    prefix: string
  }
  readonly api: {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T, ttl?: number): Promise<void>
    delete(key: string): Promise<void>
    clear(): Promise<void>
  }
  readonly hooks?: {
    invalidate?: (key: string) => Promise<void>
  }
}
```

## Creating a Custom Extension

### Step 1: Define the Extension Interface

```typescript
// In @deessejs/collections
export interface CacheExtension {
  readonly name: 'cache'
  readonly api: {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T, ttl?: number): Promise<void>
    delete(key: string): Promise<void>
    clear(): Promise<void>
  }
}
```

### Step 2: Create Connectors

```typescript
// connectors/redis.ts
import { defineCacheConnector, type CacheConnector } from '@deessejs/collections'

export const redisCache = (options: {
  url: string
  ttl?: number
}): CacheConnector => {
  const client = new RedisClient(options.url)

  return {
    name: 'redis',
    async get(key) {
      const value = await client.get(key)
      return value ? JSON.parse(value) : null
    },
    async set(key, value, ttl = options.ttl) {
      await client.set(key, JSON.stringify(value), { EX: ttl })
    },
    async delete(key) {
      await client.del(key)
    },
    async clear() {
      await client.flushdb()
    }
  }
}

// connectors/memory.ts
export const memCache = (options?: {
  ttl?: number
}): CacheConnector => {
  const store = new Map<string, { value: any; expiry: number }>()

  return {
    name: 'memory',
    async get(key) {
      const item = store.get(key)
      if (!item) return null
      if (item.expiry < Date.now()) {
        store.delete(key)
        return null
      }
      return item.value
    },
    async set(key, value, ttl = options?.ttl ?? 3600) {
      store.set(key, { value, expiry: Date.now() + ttl * 1000 })
    },
    async delete(key) {
      store.delete(key)
    },
    async clear() {
      store.clear()
    }
  }
}
```

### Step 3: Export from Collections

```typescript
// @deessejs/collections/index.ts
export { redisCache, memCache, noCache } from './connectors'
export type { CacheConnector } from './connectors'
```

## Using Extensions

### Basic Usage

```typescript
import { defineConfig, redisCache } from '@deessejs/collections'

const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  cache: redisCache({ url: 'redis://localhost:6379' })
})

// Later in your code
const cached = await config.cache.get('users:1')
if (!cached) {
  const user = await config.db.users.findById('1')
  await config.cache.set('users:1', user)
  return user
}
return cached
```

### Switching Connectors

```typescript
// Development - use in-memory cache
const devConfig = defineConfig({
  database: pgAdapter({ url: '...' }),
  cache: memCache()
})

// Production - use Redis
const prodConfig = defineConfig({
  database: pgAdapter({ url: '...' }),
  cache: redisCache({ url: process.env.REDIS_URL! })
})
```

### Extension with Options

```typescript
const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  cache: redisCache({
    url: process.env.REDIS_URL!,
    ttl: 300,           // Default TTL: 5 minutes
    prefix: 'myapp:'     // Key prefix
  }),
  email: sendGridEmail({
    apiKey: process.env.SENDGRID_API_KEY!,
    from: 'noreply@myapp.com'
  })
})
```

## Extension Hooks

Extensions can provide hooks that integrate with Collections lifecycle:

```typescript
const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  cache: redisCache({
    url: 'redis://localhost:6379',
    hooks: {
      // Invalidate cache when posts are modified
      invalidate: async (key, operation) => {
        if (operation.collection === 'posts') {
          await config.cache.delete(`posts:${operation.id}`)
        }
      }
    }
  })
})
```

## Virtual Collections from Extensions

Extensions can add their own collections:

```typescript
const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  auth: betterAuth({
    emailAndPassword: { enabled: true }
  })
})

// Auth extension adds virtual collections
config.db.users.findMany()
config.db.sessions.findMany()
```

## TypeScript Integration

Extensions provide full TypeScript support:

```typescript
// TypeScript knows cache exists
config.cache.get('key')  // ✓ Typed
config.cache.set('key', { foo: 'bar' })  // ✓ Typed

// Email is typed too
config.email.send({
  to: 'user@example.com',
  subject: 'Hello',
  body: 'World'
})
```

## Full Example

```typescript
import { defineConfig, pgAdapter, betterAuth, redisCache, sendGridEmail, s3Storage } from '@deessejs/collections'

export const config = defineConfig({
  database: pgAdapter({
    url: process.env.DATABASE_URL!
  }),

  // Auth extension
  auth: betterAuth({
    emailAndPassword: { enabled: true },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!
      }
    }
  }),

  // Cache extension
  cache: redisCache({
    url: process.env.REDIS_URL!,
    ttl: 300
  }),

  // Email extension
  email: sendGridEmail({
    apiKey: process.env.SENDGRID_API_KEY!,
    from: 'noreply@myapp.com'
  }),

  // Storage extension
  storage: s3Storage({
    bucket: process.env.AWS_BUCKET!,
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  })
})

// Use extensions
async function getUser(id: string) {
  const cacheKey = `user:${id}`

  // Try cache first
  const cached = await config.cache.get(cacheKey)
  if (cached) return cached

  // Fetch from database
  const user = await config.db.users.findById(id)

  // Cache the result
  await config.cache.set(cacheKey, user, 600)

  return user
}

async function sendWelcomeEmail(email: string) {
  await config.email.send({
    to: email,
    subject: 'Welcome!',
    template: 'welcome'
  })
}

async function uploadAvatar(userId: string, file: File) {
  const key = `avatars/${userId}`
  await config.storage.upload(key, file)
  return config.storage.getUrl(key)
}
```

## Summary

| Extension | Purpose | Built-in Connector | External Connectors |
|-----------|---------|-------------------|---------------------|
| `auth` | Authentication | Better-Auth | Clerk, Supabase, Auth0 |
| `cache` | Caching | Memory | Redis, Memcached |
| `email` | Email sending | Console | SendGrid, Resend, SMTP |
| `storage` | File storage | Local | S3, GCS, Azure |

Extensions provide:
- **Standardized interfaces** - Consistent API across implementations
- **Swappable connectors** - Change providers without code changes
- **Full TypeScript support** - Type-safe out of the box
- **Lifecycle integration** - Hooks into Collections operations
- **Virtual collections** - Extensions can add their own data models
