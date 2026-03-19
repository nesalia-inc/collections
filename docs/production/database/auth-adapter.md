# Custom Database Adapter

Learn how collections bridges Better-Auth with Drizzle using a custom adapter.

## Overview

Collections uses a custom database adapter to connect Better-Auth with your database. This adapter:
1. Uses the same Drizzle instance as your collections
2. Merges Better-Auth tables with your collections tables
3. Handles all database operations for auth (users, sessions, accounts, etc.)
4. Supports Better-Auth plugins (admin, organization, apiKey, etc.)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Collections                           │
├─────────────────────────────────────────────────────────┤
│  config.defineConfig({                                   │
│    database: pgAdapter({ url }),                        │
│    collections: [posts, todos],                         │
│    auth: { ... }                                       │
│  })                                                    │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│            CollectionsAdapter (Custom)                   │
├─────────────────────────────────────────────────────────┤
│  - createAdapterFactory(config)                         │
│  - Maps Better-Auth models to collections operations    │
│  - Uses same Drizzle instance                          │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                      Drizzle ORM                        │
├─────────────────────────────────────────────────────────┤
│  Tables: users, sessions, accounts, verification,       │
│          posts, todos, ...                            │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL                           │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### 1. Schema Merging

When auth is enabled, the adapter merges:

- **Auth tables** (from Better-Auth + plugins): `user`, `session`, `account`, `verification`, `apiKey`, etc.
- **Collection tables**: `posts`, `todos`, etc.

All tables use the same Drizzle instance and database connection.

### 2. Adapter Methods

The adapter implements all required Better-Auth methods:

```typescript
adapter: ({
  options,
  schema,
  getFieldName,
  getModelName,
  transformInput,
  transformOutput,
  transformWhereClause
}) => {
  return {
    create: async ({ model, data, select }) => { ... },
    update: async ({ model, where, update }) => { ... },
    updateMany: async ({ model, where, update }) => { ... },
    delete: async ({ model, where }) => { ... },
    deleteMany: async ({ model, where }) => { ... },
    findOne: async ({ model, where, select, join }) => { ... },
    findMany: async ({ model, where, limit, sortBy, offset, join }) => { ... },
    count: async ({ model, where }) => { ... }
  }
}
```

### 3. Model Mapping

The adapter maps Better-Auth models to the correct table:

| Better-Auth Model | Table |
|-------------------|-------|
| `user` | `users` |
| `session` | `sessions` |
| `account` | `accounts` |
| `verification` | `verifications` |
| `apiKey` | `apiKeys` |

### 4. Field Transformation

Handles field name transformations:
- `createdAt` → `created_at`
- `emailVerified` → `email_verified`

## Configuration

The adapter is created automatically when you configure auth:

```typescript
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts, todos],
  auth: {
    emailAndPassword: { enabled: true },
    plugins: [admin(), organization()]
  }
})
```

The adapter:
1. Detects which auth plugins are enabled
2. Creates the required schema tables
3. Implements the adapter methods using Drizzle

## Plugin Support

When you add Better-Auth plugins, the adapter automatically handles their tables:

```typescript
auth: {
  plugins: [
    admin(),      // Adds admin-specific tables/fields
    organization(), // Adds organization, member tables
    apiKey()     // Adds apiKey table
  }
}
```

Each plugin can add:
- New tables
- New fields to existing tables
- Custom database hooks

## Extending the Adapter

The adapter supports customization via config options:

```typescript
{
  usePlural: true,           // Table names: users, posts
  supportsJSON: true,         // Native JSON support
  supportsDates: true,        // Native date support
  supportsBooleans: true,     // Native boolean support
  debugLogs: true             // Enable debug logging
}
```

## Internal Implementation

The adapter is created using `createAdapterFactory`:

```typescript
import { createAdapterFactory } from 'better-auth/adapters'

const collectionsAdapter = (db: ReturnType<typeof drizzle>) =>
  createAdapterFactory({
    config: {
      adapterId: 'collections',
      adapterName: 'Collections Adapter',
      usePlural: false,
      supportsJSON: true,
      supportsDates: true,
      supportsBooleans: true,
      supportsNumericIds: true,
      supportsJoin: true
    },
    adapter: ({ getModelName, transformInput, transformOutput }) => {
      return {
        create: async ({ model, data, select }) => {
          const table = getModelName(model)
          return db.insert(table).values(transformInput(data)).returning()
        },
        // ... other methods
      }
    }
  })
```

## Database Connection

The same database connection is used for:

1. **Collections CRUD** - `config.db.posts.find()`, etc.
2. **Auth operations** - Sign in, sessions, etc.
3. **Plugin operations** - Organization management, API keys

This ensures:
- Single connection pool
- Consistent transaction handling
- Shared schema and migrations

## Migrations

Use the Collections CLI, which wraps Better-Auth's CLI:

```bash
# Single command - generates schema for auth + collections
npx collections migrate
```

The CLI detects:
- Your configured collections
- Auth options
- Enabled plugins

And generates the complete schema for both auth tables and collections.

## Auth Tables as Virtual Collections

Auth tables (`users`, `sessions`, `accounts`, etc.) are automatically available as Collections:

```typescript
// Access auth tables like regular collections
const users = await config.db.users.find({ limit: 10 })
const sessions = await config.db.sessions.find({
  where: { userId: user.data.id }
})
```

### Apply Hooks to Auth Tables

You can add hooks to auth collections:

```typescript
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],

  // Add hooks to auth tables
  auth: {
    emailAndPassword: { enabled: true },
    hooks: {
      users: {
        afterRead: [
          async ({ result }) => {
            // Mask sensitive fields
            return result.map(user => ({
              ...user,
              password: undefined
            }))
          }
        ]
      }
    }
  }
})
```

### Permissions on Auth Tables

Apply permissions to auth collections:

```typescript
auth: {
  emailAndPassword: { enabled: true },
  permissions: {
    users: {
      read: async ({ user }) => user?.role === 'admin',
      update: async ({ user, current }) => user?.role === 'admin',
      delete: async ({ user }) => user?.role === 'admin'
    }
  }
}
```

## Naming Convention

The adapter handles singular/plural mapping automatically:

- Collections use plural: `posts`, `users`
- Auth tables use singular: `user`, `session`

The adapter's `getModelName` function maps between them:

```typescript
// In adapter
getModelName('user')    // → users (collection table)
getModelName('posts')   // → posts
```

This ensures relations work correctly regardless of naming convention.

## Summary

| Feature | Implementation |
|---------|----------------|
| Bridge | Custom adapter using `createAdapterFactory` |
| Schema | Merged auth + collections tables |
| CLI | Unified via `collections migrate` |
| Auth Tables | Available as virtual collections with hooks/permissions |
| Naming | Automatic singular ↔ plural mapping |

The adapter is internal - users don't need to configure it manually. It's created automatically when auth is enabled.
