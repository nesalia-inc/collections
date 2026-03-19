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

### Permission Hierarchy

When both Collections permissions and Better-Auth's internal logic apply, the execution order is:

1. **Collections Permissions** (first - guard layer)
   - Collections permissions run first
   - If denied, the request is blocked immediately
   - Acts as an additional security layer

2. **Better-Auth Internal Logic**
   - After Collections permissions pass
   - Better-Auth's own validation runs
   - Handles auth-specific rules (password validation, OAuth flows, etc.)

3. **Database Adapter** (last)
   - Final execution layer
   - Actual database operation

```typescript
// Example: Collections permission blocks, Better-Auth never sees the request
permissions: {
  users: {
    // Collections checks first - if admin only, non-admins are blocked here
    read: async ({ user }) => user?.role === 'admin',
    update: async ({ user }) => user?.role === 'admin',
    delete: async ({ user }) => user?.role === 'admin'
  }
}

// If Collections allows, Better-Auth then applies its own rules
// For example: users cannot change their own email to another user's email
```

**Conflict Resolution:**

| Scenario | Outcome |
|----------|---------|
| Collections denies, Better-Auth would allow | Blocked by Collections |
| Collections allows, Better-Auth denies | Blocked by Better-Auth |
| Both allow | Operation proceeds |

This two-layer approach provides defense in depth - you can add extra restrictions via Collections while still leveraging Better-Auth's built-in security.

### Performance Warning: Hooks on High-Frequency Collections

Collections like `sessions` are accessed on **every authenticated request**. Adding hooks to these can impact performance:

```typescript
// ⚠️ Warning: Hooks on sessions run on EVERY request
betterAuthPlugin({
  hooks: {
    sessions: {
      afterRead: [
        async ({ result }) => {
          // This runs on every API call!
          return result
        }
      ]
    }
  }
})
```

**Best Practices:**

1. **Avoid hooks on `sessions`** unless absolutely necessary
2. **Use `beforeRead` sparingly** - it runs before every query
3. **Keep hooks lightweight** - no complex computations
4. **Consider middleware instead** - for per-request logic, middleware may be more appropriate

```typescript
// ✅ Better: Use middleware for request-level logic
app.use('/api/*', async (c, next) => {
  // This runs once per request, not per collection read
  await next()
})

// ✅ If you must use hooks, keep them minimal
betterAuthPlugin({
  hooks: {
    users: {
      // Only hook on write operations for users
      afterCreate: [async ({ result }) => { /* ... */ }]
    }
  }
})
```

## Virtual Collections Limitations

While virtual collections aim to behave exactly like regular collections, there are some known limitations:

### Supported Features

- ✅ CRUD operations (find, findMany, create, update, delete)
- ✅ Relations from virtual → regular collections
- ✅ Hooks on all collections
- ✅ Permissions on all collections
- ✅ Custom fields via `userFields`

### Known Limitations

| Feature | Status | Notes |
|---------|--------|-------|
| Relations to virtual collections | ⚠️ Partial | `hasMany` from virtual → regular works; reverse may require explicit configuration |
| Many-to-many via virtual | ⚠️ Partial | Junction tables must be explicit collections |
| Custom indexes | ❌ Limited | Auth table indexes are managed by Better-Auth |
| Field-level encryption | ❌ Not supported | Managed by Better-Auth |

### Relations with Virtual Collections

```typescript
// ✅ Works: Regular collection relates to virtual collection
const posts = collection({
  slug: 'posts',
  fields: {
    author: field({
      fieldType: f.relation({ to: 'users' })  // ✓ users is virtual
    })
  }
})

// ⚠️ Use caution: Virtual collection hasMany regular
const users = collection({
  slug: 'users',
  fields: {
    posts: field({
      fieldType: f.relation({ to: 'posts', many: true })
      // May require explicit configuration
    })
  }
})
```

For complex relations involving virtual collections, prefer explicit junction tables as regular collections.

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

## Config Typing with Plugins

A critical design question is: how does TypeScript know that `config.auth` exists after adding the auth plugin? This section explores all possible solutions.

### The Problem

```typescript
const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  collections: [posts],
  plugins: [betterAuthPlugin({ emailAndPassword: { enabled: true } })]
})

// How does TypeScript know config.auth exists?
config.auth.api.signIn() // ← needs typing
```

When plugins enrich the config object, TypeScript must somehow infer the new properties. Here are the possible approaches:

---

### Solution 1: Module Augmentation

The simplest approach - users import a type module that extends the config interface.

```typescript
// In @deessejs/collections-plugin-auth
import '@deessejs/collections'

declare module '@deessejs/collections' {
  interface Config {
    auth: {
      api: AuthApi
      $Infer: typeof import('./auth-infer').$Infer
    }
  }
}

// Usage - auth is automatically typed
const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  collections: [posts],
  plugins: [betterAuthPlugin({ emailAndPassword: { enabled: true } })]
})

config.auth.api.signIn() // ✓ Typed
```

**Pros:**
- Simple, no build step needed
- Works automatically when plugin is imported

**Cons:**
- Global interface modification
- Can't "remove" types if plugin is not used
- Hard to composition multiple plugins

---

### Solution 2: .use() Chainable Pattern

Plugins return an enriched config object through a chainable `.use()` method.

```typescript
const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  collections: [posts]
})
  .use(betterAuthPlugin({ emailAndPassword: { enabled: true } }))
  .use(seoPlugin())

// Each .use() returns a new config with additional types
config.auth.api.signIn()        // ✓ Typed
config.db.seo.getMeta('/')     // ✓ Typed
```

Implementation:

```typescript
interface ConfigBuilder<T> {
  use<P extends AuthPlugin>(plugin: P): ConfigBuilder<T & { auth: AuthOutput<P> }>
  use<P extends SeoPlugin>(plugin: P): ConfigBuilder<T & { seo: SeoOutput<P> }>
  build(): T
}

function defineConfig(config: BaseConfig): ConfigBuilder<BaseConfig>
```

**Pros:**
- Explicit about what plugins add
- Composable and chainable
- No global type pollution

**Cons:**
- More verbose than inline plugins
- Requires each plugin to have typed `.use()` overloads

---

### Solution 3: Generic Inference with Plugins Array

TypeScript infers types from the plugins array passed to defineConfig.

```typescript
const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  collections: [posts],
  plugins: [
    betterAuthPlugin({ emailAndPassword: { enabled: true } }),
    organizationPlugin()
  ]
})

config.auth.api.signIn()              // ✓ Typed
config.db.organizations.findMany()    // ✓ Typed
```

Implementation:

```typescript
type PluginOutput<P> = P extends Plugin<infer O> ? O : never

type EnrichedConfig<C, P extends Plugin<any>[]> = C & UnionToIntersection<PluginOutput<P>>

function defineConfig<C extends BaseConfig, P extends Plugin<any>[]>(
  config: C & { plugins: [...P] }
): EnrichedConfig<C, P>
```

**Pros:**
- Single location for config and plugins
- TypeScript infers all additions automatically

**Cons:**
- Complex type inference
- Plugin types must be properly designed for inference

---

### Solution 4: Type Generation (collections-types)

The CLI generates a `collections-types.ts` file with exact types based on config.

```typescript
// collections-types.ts (generated)
import { BaseConfig } from '@deessejs/collections'

export type Config = BaseConfig & {
  auth: {
    api: {
      signIn: (options: SignInOptions) => Promise<Session>
      signOut: (options: SignOutOptions) => Promise<void>
      // ... all auth methods
    }
    $Infer: {
      Session: { user: User; session: Session }
      User: User
    }
  }
  db: {
    users: Collection<UsersCollection>
    sessions: Collection<SessionsCollection>
    // ... virtual collections
  }
}
```

Usage:

```typescript
import type { Config } from './collections-types'

function getConfig(): Config {
  return defineConfig({ /* ... */ }) as Config
}

const config = getConfig()
config.auth.api.signIn() // ✓ Typed
```

**Pros:**
- Exact types based on actual configuration
- Works with any plugin combination
- No complex type inference

**Cons:**
- Requires code generation step
- Types can become stale if not regenerated

---

### Solution 5: Higher-Kinded Types (HKT) Simulation

Simulating HKT using TypeScript's type system to transform config types.

```typescript
// Plugin as a type-level function
interface Plugin<Config, Output> {
  readonly _config: Config
  readonly _output: Output
  readonly extend: (config: Config) => Config & Output
}

// BetterAuthPlugin transforms BaseConfig → ConfigWithAuth
interface BetterAuthPlugin extends Plugin<
  BaseConfig,
  { auth: AuthApi }
> {}

function betterAuthPlugin(options: AuthOptions): BetterAuthPlugin

// Usage with HKT-style composition
const config = pipe(
  baseConfig,
  betterAuthPlugin({ emailAndPassword: { enabled: true } }).extend,
  seoPlugin().extend,
  analyticsPlugin().extend
)

config.auth.api.signIn() // ✓ Typed
```

Implementation helpers:

```typescript
// pipe function for chaining
function pipe<A, B>(a: A, fn: (a: A) => A & B): A & B
function pipe<A, B, C>(a: A, fn1: (a: A) => A & B, fn2: (a: A & B) => A & B & C): A & B & C

// Or using function composition
const extendAuth = betterAuthPlugin({ emailAndPassword: { enabled: true } }).extend
const extendSeo = seoPlugin().extend

const config = extendSeo(extendAuth(baseConfig))
```

**Pros:**
- Theoretically elegant
- Composable at the type level
- Clear separation of concerns

**Cons:**
- Complex to implement correctly
- TypeScript doesn't have true HKT support
- Can be hard to debug

---

### Solution 6: Builder Pattern with Generics

A class-based builder that accumulates types as plugins are added.

```typescript
class ConfigBuilder<C extends BaseConfig = BaseConfig> {
  private config: C

  constructor(config: C) {
    this.config = config
  }

  use<P extends Plugin>(this: ConfigBuilder<C>, plugin: P): ConfigBuilder<C & P["output"]> {
    return new ConfigBuilder({
      ...this.config,
      ...plugin.extend(this.config)
    } as C & P["output"])
  }

  build(): C {
    return this.config
  }
}

// Usage
const config = new ConfigBuilder(baseConfig)
  .use(betterAuthPlugin({ emailAndPassword: { enabled: true } }))
  .use(organizationPlugin())
  .build()

config.auth.api.signIn()      // ✓ Typed
config.organizations         // ✓ Typed
```

**Pros:**
- Explicit about transformation steps
- Type-safe accumulation of plugins
- Easy to understand

**Cons:**
- More verbose syntax
- Requires class wrapper

---

### Comparison

| Solution | DX | Type Safety | Complexity | Build Step |
|----------|-----|-------------|------------|------------|
| Module Augmentation | ★★★★★ | ★★★★☆ | Low | No |
| .use() Chainable | ★★★★☆ | ★★★★★ | Medium | No |
| Generic Inference | ★★★★☆ | ★★★★☆ | High | No |
| Type Generation | ★★★☆☆ | ★★★★★ | Low | Yes |
| HKT Simulation | ★★★☆☆ | ★★★★☆ | Very High | No |
| Builder Pattern | ★★★☆☆ | ★★★★★ | Medium | No |

---

### Recommendation

The choice depends on your project complexity:

#### For Simple Projects (Single App)

**Module Augmentation** is the best choice:

```typescript
import { betterAuthPlugin } from '@deessejs/collections-plugin-auth'
// ↑ This import extends the Config interface automatically

const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  plugins: [betterAuthPlugin({ emailAndPassword: { enabled: true } })]
})

config.auth.api.signIn() // ✓ Typed!
```

- Zero configuration required
- Types work out of the box
- Simplest DX

#### For Complex Projects (Monorepo, Multiple Apps)

**Generic Inference (Solution 3)** or **.use() (Solution 2)** are cleaner:

```typescript
// Option A: Generic Inference - types stay local to this config
const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  collections: [posts],
  plugins: [
    betterAuthPlugin({ emailAndPassword: { enabled: true } }),
    organizationPlugin()
  ]
} as const)

// Option B: .use() - explicit chaining
const config = defineConfig({
  database: pgAdapter({ url: '...' }),
  collections: [posts]
})
  .use(betterAuthPlugin({ emailAndPassword: { enabled: true } }))
  .use(organizationPlugin())
```

Why avoid Module Augmentation in monorepos?
- Global interface pollution
- Can affect other packages unintentionally
- Harder to track where types come from

#### For Enterprise / Strictly Typed Projects

**Type Generation (Solution 4)** provides the most control:

- Generated types are explicit and reviewable
- Works regardless of plugin import order
- No runtime type inference magic

```bash
# CLI generates types
npx @deessejs/collections-cli generate-types
```

---

**Current Implementation:**

The auth plugin uses **Module Augmentation** for the simplest DX. However, future versions will support alternative typing approaches for complex architectures.

---

### Future: True HKT Support

TypeScript currently doesn't support true Higher-Kinded Types. If/when they are added, the ideal syntax would be:

```typescript
// Hypothetical future TypeScript with HKT
type Plugin<F<_} = {_}>

const betterAuthPlugin: Plugin<Config> = (config) => config & { auth: AuthApi }

type ExtendedConfig = Config |> betterAuthPlugin |> seoPlugin
```

This would provide the ultimate type-safe, composable plugin system. For now, the solutions above provide practical workarounds.
