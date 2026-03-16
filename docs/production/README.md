# @deessejs/collections

A high-level data modeling and API layer built on top of Drizzle ORM. Inspired by PayloadCMS but designed for programmatic usage.

## Features

- **Collections** - Define data models with fields and types
- **Auth** - Built-in authentication with Better-Auth
- **REST API** - Automatic REST endpoints
- **Hooks** - Lifecycle hooks for validation and logic
- **Relations** - Link collections together
- **TypeScript** - Full type inference

## Quick Start

```bash
pnpm add @deessejs/collections drizzle-orm
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

## Authentication

Add built-in auth with users collection:

```typescript
import { defineAuth } from '@deessejs/collections'

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  auth: defineAuth({
    emailAndPassword: { enabled: true }
  })
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

## Documentation

- [Quick Start](./quick-start.md)
- [Authentication](./authentication.md)
- [Next.js](./nextjs.md)
- [REST API](./api.md)
- [Field Types](./field-types.md)
- [Configuration](./configuration.md)
- [Hooks](./hooks.md)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your App                              │
├─────────────────────────────────────────────────────────┤
│  Collections API                                        │
│  ├── CRUD Operations (db.posts.find, etc.)             │
│  ├── Auth API (auth.api.signIn, etc.)                   │
│  └── REST Endpoints (/api/collections/*)              │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    Drizzle ORM   │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    PostgreSQL    │
                    └─────────────────┘
```

## License

MIT
