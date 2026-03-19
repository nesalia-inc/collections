# Better-Auth as a Plugin

Learn how Collections integrates Better-Auth as a first-class plugin, creating virtual collections from auth tables.

## Overview

Collections treats Better-Auth as a **plugin** that provides virtual collections for authentication tables. This architecture:

1. **Plugin-based** - Better-Auth is loaded as a plugin, not hardcoded
2. **Provider-agnostic** - Works with any database provider (PostgreSQL, MySQL, SQLite)
3. **Virtual Collections** - Auth tables become queryable collections
4. **Same API** - Access auth data using the same CRUD operations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    defineConfig()                            │
├─────────────────────────────────────────────────────────────┤
│  plugins: [                                                 │
│    betterAuthPlugin({                                       │
│      emailAndPassword: { enabled: true },                 │
│      plugins: [admin(), organization()]                    │
│    })                                                      │
│  ]                                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BetterAuthPlugin                           │
├─────────────────────────────────────────────────────────────┤
│  - Creates virtual collections from auth tables             │
│  - Provides hooks for auth events                           │
│  - Exposes auth API endpoints                               │
│  - Maps auth models to collections                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Virtual Collections                          │
├─────────────────────────────────────────────────────────────┤
│  users, sessions, accounts, verifications, apiKeys,          │
│  organizations, members, ...                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Provider                          │
├─────────────────────────────────────────────────────────────┤
│  pgAdapter | mysqlAdapter | sqliteAdapter | custom         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                                │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL | MySQL | SQLite | Custom                      │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### As a Plugin

```typescript
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'
import { betterAuthPlugin } from '@deessejs/collections-plugin-auth'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() })
  }
})

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  plugins: [
    betterAuthPlugin({
      emailAndPassword: { enabled: true },
      socialProviders: {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!
        }
      },
      plugins: [
        admin(),
        organization()
      ]
    })
  ]
})
```

### Why as a Plugin?

Treating Better-Auth as a plugin provides:

| Benefit | Description |
|---------|-------------|
| **Flexibility** | Enable/disable auth easily |
| **Swappable** | Replace with other auth solutions |
| **Extensible** | Add custom auth providers |
| **Consistent** | Same API pattern as other plugins |
| **Type-safe** | Full TypeScript inference |

## Virtual Collections

When the auth plugin is enabled, it creates **virtual collections** for each auth table:

### Available Collections

| Collection | Description |
|------------|-------------|
| `users` | User accounts |
| `sessions` | Active sessions |
| `accounts` | OAuth/credential accounts |
| `verifications` | Email verification tokens |
| `apiKeys` | API keys (if apiKey plugin enabled) |
| `organizations` | Organizations (if organization plugin enabled) |
| `members` | Organization members (if organization plugin enabled) |

### Accessing Virtual Collections

```typescript
// Query users collection
const users = await config.db.users.findMany()

// Query with filters
const activeSessions = await config.db.sessions.findMany({
  where: { expiresAt: { gt: new Date() } }
})

// Find user by ID
const user = await config.db.users.findById(userId)

// Relations work naturally
const userWithSessions = await config.db.users.findById(userId, {
  include: { sessions: true }
})
```

## Auth Tables as Virtual Collections

Auth tables are automatically available as Collections with full CRUD capabilities:

```typescript
// Access auth tables like regular collections
const users = await config.db.users.find({ limit: 10 })
const sessions = await config.db.sessions.find({
  where: { userId: user.data.id }
})
```

### Collection Structure

Each virtual collection has predefined fields based on Better-Auth's schema:

```typescript
// Users collection fields (auto-generated)
type UsersCollection = {
  id: string
  name: string | null
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
  // Custom fields if extended
}

// Sessions collection fields
type SessionsCollection = {
  id: string
  userId: string
  token: string
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
}
```

## Hooks on Auth Tables

You can add hooks to virtual auth collections:

```typescript
betterAuthPlugin({
  emailAndPassword: { enabled: true },
  hooks: {
    users: {
      afterRead: [
        async ({ result }) => {
          // Mask sensitive fields
          return result.map(user => ({
            ...user,
            // Remove any sensitive fields
          }))
        }
      ]
    },
    sessions: {
      beforeCreate: [
        async ({ data }) => {
          // Add IP address tracking
          return {
            ...data,
            ipAddress: getClientIp(),
            userAgent: getUserAgent()
          }
        }
      ]
    }
  }
})
```

### Available Hooks

| Collection | Hooks |
|------------|-------|
| `users` | beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeRead, afterRead, beforeDelete, afterDelete |
| `sessions` | beforeCreate, afterCreate, beforeDelete, afterDelete, beforeRead, afterRead |
| `accounts` | beforeCreate, afterCreate, beforeDelete, afterDelete |
| `verifications` | beforeCreate, afterCreate, beforeRead, afterRead |

## Permissions

Apply permissions to auth collections:

```typescript
betterAuthPlugin({
  emailAndPassword: { enabled: true },
  permissions: {
    users: {
      read: async ({ user }) => user?.role === 'admin',
      update: async ({ user, current }) => user?.role === 'admin' || current.id === user?.id,
      delete: async ({ user }) => user?.role === 'admin'
    },
    sessions: {
      read: async ({ user }) => true,  // Users can read their own sessions
      delete: async ({ user, current }) => user?.id === current.userId || user?.role === 'admin'
    }
  }
})
```

### Permission Context

Each permission receives a context object:

```typescript
permissions: {
  users: {
    read: async ({ user, query }) => {
      // user: current authenticated user
      // query: the incoming query
      // Return true to allow, false to deny
      return user?.role === 'admin' || query.where?.id === user?.id
    }
  }
}
```

## Auth Events

Listen to auth events from the plugin:

```typescript
betterAuthPlugin({
  emailAndPassword: { enabled: true },
  onAuthEvent: (event) => {
    switch (event.type) {
      case 'signIn':
        console.log(`User ${event.userId} signed in`)
        break
      case 'signOut':
        console.log(`User ${event.userId} signed out`)
        break
      case 'userCreated':
        console.log(`New user created: ${event.userId}`)
        break
      case 'userUpdated':
        console.log(`User updated: ${event.userId}`)
        break
    }
  }
})
```

## Extending Users Collection

Extend the users collection with custom fields:

```typescript
betterAuthPlugin({
  emailAndPassword: { enabled: true },
  userFields: {
    role: field({
      fieldType: f.select(['user', 'admin', 'moderator']),
      defaultValue: 'user'
    }),
    bio: field({
      fieldType: f.text(),
      required: false
    }),
    avatar: field({
      fieldType: f.text(),
      required: false
    }),
    settings: field({
      fieldType: f.json(),
      required: false
    })
  }
})
```

These fields are added to the `users` virtual collection and stored in the same table.

## Plugin Support

Better-Auth plugins are passed directly to the auth plugin:

```typescript
betterAuthPlugin({
  emailAndPassword: { enabled: true },
  plugins: [
    admin(),           // Admin functions
    organization(),   // Organization management
    apiKey(),         // API key authentication
    twoFactor()       // Two-factor authentication
  ]
})
```

Each plugin adds its own virtual collections:

| Plugin | Adds Collections |
|--------|-----------------|
| `admin()` | - |
| `organization()` | `organizations`, `members` |
| `apiKey()` | `apiKeys` |
| `twoFactor()` | `twoFactorSecrets` |

## Database Provider

The auth plugin works with any database provider. The provider handles:

1. **Schema creation** - Creating auth tables
2. **Query execution** - Running CRUD operations
3. **Type translation** - Converting between database types

```typescript
// Works with any provider
const config = defineConfig({
  database: pgAdapter({ url: process.env.POSTGRES_URL }),
  plugins: [betterAuthPlugin({ ... })]
})

// Or SQLite
const configLocal = defineConfig({
  database: sqliteAdapter({ url: './data.db' }),
  plugins: [betterAuthPlugin({ ... })]
})
```

### Provider-Specific Features

Some features vary by provider:

| Feature | PostgreSQL | MySQL | SQLite |
|---------|------------|-------|--------|
| Native UUID | ✓ | ✗ (varchar) | ✗ (text) |
| Native JSON | ✓ (jsonb) | ✓ | ✗ (text) |
| Indexes | Full | Full | Limited |

## Migrations

The CLI handles migrations for auth tables automatically:

```bash
# Push schema including auth tables
npx @deessejs/collections-cli push
```

The CLI detects:
- Auth plugin configuration
- Enabled plugins
- Custom user fields

And generates the complete schema for all virtual collections.

## Without Auth

If you don't need authentication, simply don't include the plugin:

```typescript
// No auth - just your collections
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts, comments]
  // No auth plugin
})
```

This creates a lightweight setup without any auth tables.

## Full Example

```typescript
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'
import { betterAuthPlugin } from '@deessejs/collections-plugin-auth'
import { admin, organization } from 'better-auth/plugins'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean(), defaultValue: false }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  },
  hooks: {
    beforeCreate: [
      async ({ data, context }) => {
        // Get user from session
        const session = await context.auth?.getSession()
        if (!session) throw new Error('Must be authenticated')
        data.author = session.user.id
        return data
      }
    ]
  }
})

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  plugins: [
    betterAuthPlugin({
      emailAndPassword: { enabled: true },
      socialProviders: {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!
        }
      },
      userFields: {
        role: field({
          fieldType: f.select(['user', 'admin']),
          defaultValue: 'user'
        })
      },
      plugins: [admin(), organization()],
      hooks: {
        users: {
          afterRead: [
            async ({ result }) => {
              return result.map(u => ({ ...u }))
            }
          ]
        }
      },
      onAuthEvent: (event) => {
        console.log('Auth event:', event.type, event.userId)
      }
    })
  ]
})
```

## Summary

| Concept | Description |
|---------|-------------|
| **Plugin** | Better-Auth is a plugin, not built-in |
| **Virtual Collections** | Auth tables become queryable collections |
| **Provider-Agnostic** | Works with any database provider |
| **Hooks** | Add lifecycle logic to auth operations |
| **Permissions** | Control access to auth collections |
| **Extensible** | Custom fields, plugins, events |

The auth plugin creates a seamless experience where authentication tables are just another set of collections you can query and extend.
