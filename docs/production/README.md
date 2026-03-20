# @deessejs/collections

A high-level data modeling and API layer with a provider-agnostic database system. Inspired by PayloadCMS but designed for programmatic usage.

## Features

- **Collections** - Define data models with fields and types
- **Auth** - Optional authentication with swappable providers (Better-Auth, Clerk, Supabase)
- **Extensions** - Predefined interfaces for cache, email, storage with swappable connectors
- **REST API** - Automatic REST endpoints
- **Hooks** - Lifecycle hooks for validation and logic
- **Relations** - Link collections together
- **TypeScript** - Full type inference

## Quick Start

```bash
pnpm add @deessejs/collections
```

```typescript
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts]
})
```

## Authentication (Optional)

Auth is optional and provider-agnostic. Multiple auth providers are available:

```typescript
// With Better-Auth (built-in)
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  auth: betterAuth({ emailAndPassword: { enabled: true } })
})

// With Clerk
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  auth: clerk({ instanceId: '...' })
})
```

## Extensions

Extensions provide additional capabilities with swappable connectors:

```typescript
import { defineConfig, redisCache, sendGridEmail, s3Storage } from '@deessejs/collections'

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],

  // Cache extension - switch connectors easily
  cache: redisCache({ url: process.env.REDIS_URL! }),

  // Email extension
  email: sendGridEmail({ apiKey: process.env.SENDGRID_API_KEY! }),

  // Storage extension
  storage: s3Storage({ bucket: process.env.AWS_BUCKET! })
})
```

## Next.js Integration

Create an API route:

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

## Field Types

| Type | Description |
|------|-------------|
| `f.text()` | String |
| `f.number()` | Integer |
| `f.boolean()` | Boolean |
| `f.email()` | Email with validation |
| `f.date()` | Date only |
| `f.timestamp()` | Date with time |
| `f.select(['a', 'b'])` | Enum |
| `f.json()` | JSON object |
| `f.relation({ to: 'users' })` | Relation |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collections/:collection` | List records |
| GET | `/api/collections/:collection/:id` | Get record |
| POST | `/api/collections/:collection` | Create record |
| PUT | `/api/collections/:collection/:id` | Update record |
| DELETE | `/api/collections/:collection/:id` | Delete record |

## Documentation Structure

### Getting Started
- [Quick Start](./getting-started/quick-start.md)

### Core Concepts
- [Overview](./core-concepts/README.md) - Core concepts overview
- [Collections](./core-concepts/collection/README.md) - Data models
- [Fields & Types](./core-concepts/fields.md) - Field definitions
- [Hooks](./core-concepts/hooks.md) - Lifecycle hooks
- [Operations](./core-concepts/operations.md) - CRUD operations
- [Configuration](./core-concepts/config/README.md) - Configuration

### Database
- [Database Overview](./database/README.md)
- [Connections](./database/connections.md) - Database adapters
- [Providers](./database/providers.md) - Custom providers
- [Auth Providers](./database/auth.md) - Auth provider configuration

### Features
- [Authentication](./features/authentication.md) - Auth configuration
- [Extensions](./features/extensions.md) - Cache, email, storage extensions
- [Plugins](./features/plugins/README.md) - Custom plugins

### API
- [REST API](./api/api.md)

### Integrations
- [Next.js](./integrations/nextjs.md)
- [CLI](./integrations/cli.md)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your App                              │
├─────────────────────────────────────────────────────────┤
│  Collections API                                        │
│  ├── CRUD Operations (db.posts.find, etc.)             │
│  ├── Extensions (cache, email, storage)                 │
│  └── REST Endpoints (/api/collections/*)              │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Collections Core │
                    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   Database Provider                      │
├─────────────────────────────────────────────────────────┤
│  pgAdapter | mysqlAdapter | sqliteAdapter | custom      │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    PostgreSQL    │
                    │    (or any DB)   │
                    └─────────────────┘
```

## License

MIT