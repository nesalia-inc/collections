# Better-Auth Integration Architecture

This document describes how to integrate Better-Auth with Collections, treating authentication as a specialized collection type that leverages the provider infrastructure.

## Overview

Better-Auth provides a comprehensive authentication framework with:
- **Core models**: user, session, account, verification
- **Plugins**: admin, organization, api-key, passkey, oauth, etc.
- **Adapter interface**: Database-agnostic CRUD operations
- **Schema generation**: CLI tools to generate database schema

Collections should integrate Better-Auth by:
1. Treating auth models as special collection types
2. Using the provider infrastructure to execute adapter operations
3. Leveraging the existing Better-Auth adapter interface

## Architecture

### Current Better-Auth Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Better-Auth                              │
├─────────────────────────────────────────────────────────────┤
│  betterAuth({                                            │
│    adapter: drizzleAdapter(db, { provider: 'pg' })        │
│    plugins: [admin(), organization()]                     │
│  })                                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               createAdapterFactory                          │
├─────────────────────────────────────────────────────────────┤
│  Takes CustomAdapter interface and config                 │
│  Returns DBAdapter with all CRUD methods                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DBAdapter Interface                      │
├─────────────────────────────────────────────────────────────┤
│  create, findOne, findMany, count, update, updateMany,   │
│  delete, deleteMany, transaction                         │
│                                                             │
│  + transforms for:                                        │
│    - field names (emailVerified → email_verified)        │
│    - data types (Date ↔ string, JSON ↔ string)          │
│    - custom ID generation                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Drizzle / Provider                        │
└─────────────────────────────────────────────────────────────┘
```

### Integration with Collections

```
┌─────────────────────────────────────────────────────────────┐
│                    Collections                              │
├─────────────────────────────────────────────────────────────┤
│  defineConfig({                                          │
│    database: pgAdapter({ url }),                          │
│    auth: {                                               │
│      plugins: [admin(), organization()]                   │
│    },                                                    │
│    collections: [posts, users]                            │
│  })                                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Auth Collection Factory                      │
├─────────────────────────────────────────────────────────────┤
│  - Defines auth collections (user, session, account...)   │
│  - Merges plugin schemas                                 │
│  - Generates Better-Auth adapter                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Provider Interface                         │
├─────────────────────────────────────────────────────────────┤
│  buildFind(collection, query) → QueryBuilder             │
│  buildCreate(collection, data) → QueryBuilder            │
│  execute(queryBuilder) → Result                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  pgAdapter / mysqlAdapter / sqliteAdapter   │
└─────────────────────────────────────────────────────────────┘
```

## Better-Auth Adapter Interface

The core Better-Auth adapter interface (from `packages/core/src/db/adapter/index.ts`):

```typescript
type CustomAdapter = {
  create: <T>({
    model,
    data,
    select
  }: { model: string; data: T; select?: string[] }) => Promise<T>

  findOne: <T>({
    model,
    where,
    select,
    join
  }: {
    model: string
    where: CleanedWhere[]
    select?: string[]
    join?: JoinConfig
  }) => Promise<T | null>

  findMany: <T>({
    model,
    where,
    limit,
    select,
    sortBy,
    offset,
    join
  }: {
    model: string
    where?: CleanedWhere[]
    limit: number
    select?: string[]
    sortBy?: { field: string; direction: 'asc' | 'desc' }
    offset?: number
    join?: JoinConfig
  }) => Promise<T[]>

  count: ({ model, where }: { model: string; where?: CleanedWhere[] }) => Promise<number>

  update: <T>({
    model,
    where,
    update
  }: { model: string; where: CleanedWhere[]; update: T }) => Promise<T | null>

  updateMany: ({
    model,
    where,
    update
  }: { model: string; where: CleanedWhere[]; update: Record<string, any> }) => Promise<number>

  delete: ({ model, where }: { model: string; where: CleanedWhere[] }) => Promise<void>

  deleteMany: ({ model, where }: { model: string; where: CleanedWhere[] }) => Promise<number>

  createSchema?: (props: { file?: string; tables: BetterAuthDBSchema }) => Promise<DBAdapterSchemaCreation>
}
```

### Where Operators

```typescript
const whereOperators = [
  'eq', 'ne', 'lt', 'lte', 'gt', 'gte',
  'in', 'not_in', 'contains', 'starts_with', 'ends_with'
] as const

type Where = {
  operator?: WhereOperator
  value: string | number | boolean | string[] | number[] | Date | null
  field: string
  connector?: 'AND' | 'OR'
}
```

### Adapter Configuration

Better-Auth adapters can be configured with:

```typescript
type DBAdapterFactoryConfig = {
  usePlural?: boolean           // Table names: users, posts (default: false)
  debugLogs?: boolean
  adapterId: string
  adapterName?: string

  // Database capabilities
  supportsNumericIds?: boolean  // Default: true
  supportsUUIDs?: boolean       // Default: false (true for PostgreSQL)
  supportsJSON?: boolean        // Default: false
  supportsDates?: boolean       // Default: true
  supportsBooleans?: boolean   // Default: true
  supportsArrays?: boolean      // Default: false

  // Transaction support
  transaction?: boolean | (<R>(callback: (trx) => Promise<R>) => Promise<R>)

  // Custom transformations
  mapKeysTransformInput?: Record<string, string>
  mapKeysTransformOutput?: Record<string, string>
  customTransformInput?: (props) => any
  customTransformOutput?: (props) => any

  // ID generation
  disableIdGeneration?: boolean
  customIdGenerator?: ({ model }) => string
}
```

## Integration Approach

### 1. Auth Collections Definition

Auth collections should be defined using the same DSL as regular collections:

```typescript
// Auth collections - these are built-in
const authCollections = {
  user: defineCollection({
    slug: 'user',
    fields: {
      id: { kind: 'uuid', autoGenerate: true },
      email: { kind: 'text', maxLength: 255 },
      emailVerified: { kind: 'boolean', default: false },
      name: { kind: 'text' },
      image: { kind: 'text', required: false },
      createdAt: { kind: 'timestamp', default: 'now' },
      updatedAt: { kind: 'timestamp', default: 'now' }
    }
  }),

  session: defineCollection({
    slug: 'session',
    fields: {
      id: { kind: 'uuid', autoGenerate: true },
      userId: { kind: 'uuid', relation: { target: 'user', type: 'one-to-many' } },
      expiresAt: { kind: 'timestamp' },
      token: { kind: 'text' },
      ipAddress: { kind: 'text', required: false },
      userAgent: { kind: 'text', required: false },
      createdAt: { kind: 'timestamp', default: 'now' }
    }
  }),

  account: defineCollection({
    slug: 'account',
    fields: {
      id: { kind: 'uuid', autoGenerate: true },
      userId: { kind: 'uuid', relation: { target: 'user', type: 'one-to-many' } },
      accountId: { kind: 'text' },
      providerId: { kind: 'text' },
      accessToken: { kind: 'text', required: false },
      refreshToken: { kind: 'text', required: false },
      idToken: { kind: 'text', required: false },
      accessTokenExpiresAt: { kind: 'timestamp', required: false },
      refreshTokenExpiresAt: { kind: 'timestamp', required: false },
      scope: { kind: 'text', required: false },
      password: { kind: 'text', required: false },
      createdAt: { kind: 'timestamp', default: 'now' },
      updatedAt: { kind: 'timestamp', default: 'now' }
    }
  }),

  verification: defineCollection({
    slug: 'verification',
    fields: {
      id: { kind: 'uuid', autoGenerate: true },
      identifier: { kind: 'text' },
      value: { kind: 'text' },
      expiresAt: { kind: 'timestamp' },
      createdAt: { kind: 'timestamp', default: 'now' }
    }
  })
}
```

### 2. Plugin Schema Integration

Better-Auth plugins add their own collections. For example, the admin plugin:

```typescript
// Admin plugin adds these collections
const adminCollections = {
  admin: defineCollection({
    slug: 'admin',
    fields: {
      userId: { kind: 'uuid', relation: { target: 'user', type: 'one-to-one' } },
      role: { kind: 'enum', values: ['admin', 'superadmin'] as const }
    }
  })
}

// Organization plugin
const organizationCollections = {
  organization: defineCollection({
    slug: 'organization',
    fields: {
      id: { kind: 'uuid', autoGenerate: true },
      name: { kind: 'text' },
      slug: { kind: 'text' },
      logo: { kind: 'text', required: false },
      metadata: { kind: 'json', required: false },
      createdAt: { kind: 'timestamp', default: 'now' }
    }
  }),

  member: defineCollection({
    slug: 'member',
    fields: {
      id: { kind: 'uuid', autoGenerate: true },
      organizationId: { kind: 'uuid', relation: { target: 'organization' } },
      userId: { kind: 'uuid', relation: { target: 'user' } },
      role: { kind: 'enum', values: ['owner', 'admin', 'member'] as const },
      createdAt: { kind: 'timestamp', default: 'now' }
    }
  }),

  invitation: defineCollection({
    slug: 'invitation',
    fields: {
      id: { kind: 'uuid', autoGenerate: true },
      organizationId: { kind: 'uuid', relation: { target: 'organization' } },
      email: { kind: 'text' },
      role: { kind: 'enum', values: ['owner', 'admin', 'member'] as const },
      status: { kind: 'enum', values: ['pending', 'accepted', 'rejected'] as const },
      expiresAt: { kind: 'timestamp' },
      inviterId: { kind: 'uuid', relation: { target: 'user' } },
      createdAt: { kind: 'timestamp', default: 'now' }
    }
  })
}
```

### 3. Adapter Bridge

The key is to bridge the Collections provider interface with Better-Auth's adapter:

```typescript
// In @deessejs/collections-auth (new package)

import { createAdapterFactory } from 'better-auth/adapters'

type AuthConfig = {
  emailAndPassword?: {
    enabled: boolean
    requireEmailVerification?: boolean
  }
  plugins?: AuthPlugin[]
  // ... other auth options
}

// The auth collection factory
const createAuthCollections = (
  config: AuthConfig,
  provider: DatabaseProvider
) => {
  // Start with core auth collections
  const collections = { ...authCollections }

  // Merge plugin collections
  for (const plugin of config.plugins || []) {
    const pluginCollections = plugin.getCollections()
    Object.assign(collections, pluginCollections)
  }

  return collections
}

// Create Better-Auth adapter from provider
const createAuthAdapter = (
  provider: DatabaseProvider,
  collections: Record<string, CollectionConfig>
) => {
  return createAdapterFactory({
    config: {
      adapterId: 'collections-auth',
      adapterName: 'Collections Auth Adapter',
      usePlural: false,
      supportsUUIDs: provider.supports.uuid === 'native',
      supportsJSON: provider.supports.json === 'native',
      supportsArrays: provider.supports.array,
      transaction: provider.supports.transaction
    },
    adapter: ({ getFieldName, transformInput, transformOutput, getModelName }) => ({
      create: async ({ model, data, select }) => {
        const query = provider.buildCreate(collections[model], data)
        const result = await provider.execute(query)
        return transformOutput(result, model, select)
      },

      findOne: async ({ model, where, select, join }) => {
        const query = provider.buildFindOne(collections[model], where)
        const result = await provider.execute(query)
        return result ? transformOutput(result, model, select) : null
      },

      findMany: async ({ model, where, limit, select, sortBy, offset, join }) => {
        const query = provider.buildFind(collections[model], { where, limit, orderBy: sortBy, offset })
        const results = await provider.execute(query)
        return results.map(r => transformOutput(r, model, select))
      },

      count: async ({ model, where }) => {
        const query = provider.buildCount(collections[model], { where })
        return await provider.execute(query)
      },

      update: async ({ model, where, update }) => {
        const query = provider.buildUpdate(collections[model], where, update)
        const result = await provider.execute(query)
        return result ? transformOutput(result, model) : null
      },

      updateMany: async ({ model, where, update }) => {
        const query = provider.buildUpdateMany(collections[model], where, update)
        return await provider.execute(query)
      },

      delete: async ({ model, where }) => {
        const query = provider.buildDelete(collections[model], where)
        await provider.execute(query)
      },

      deleteMany: async ({ model, where }) => {
        const query = provider.buildDeleteMany(collections[model], where)
        return await provider.execute(query)
      },

      transaction: async (callback) => {
        return provider.transaction(callback)
      }
    })
  })
}
```

### 4. Usage in defineConfig

```typescript
import { defineConfig } from '@deessejs/collections'
import { admin, organization } from '@deessejs/collections-auth'

// With auth enabled
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL }),

  // Auth configuration - automatically creates auth collections
  auth: {
    emailAndPassword: { enabled: true },
    plugins: [
      admin(),
      organization()
    ]
  },

  // Your application collections
  collections: [posts, todos, comments]
})

// The config now has both:
// - config.db.auth.* for authentication operations
// - config.db.posts.* for collection CRUD
```

## Key Design Decisions

### 1. Separation of Concerns

- **Collections** handles data modeling and CRUD
- **Auth** handles authentication and authorization
- **Provider** handles database-specific operations
- **Better-Auth adapter** bridges the two

### 2. Zero Drizzle Coupling in Core

The auth integration should be in a separate package (`@deessejs/collections-auth`):

```
@deessejs/collections      → Core DSL and provider interface
@deessejs/collections-drizzle → Drizzle provider implementation
@deessejs/collections-auth    → Better-Auth integration (new)
```

### 3. Plugin System

Better-Auth plugins should map to collection plugins:

```typescript
// Instead of Better-Auth's plugin system
const plugin = {
  id: 'admin',
  getCollections: () => ({ admin, adminRole }),
  getHooks: () => ({ ... })
}

// Use Collections' plugin system
const adminPlugin = createCollectionPlugin({
  name: 'admin',
  collections: {
    admin: defineCollection({ ... })
  },
  hooks: {
    beforeCreate: { ... }
  }
})
```

### 4. Schema Generation

Better-Auth has CLI tools for schema generation. In Collections:

```typescript
// CLI generates both auth and collection schemas
// npx collections generate

// Output includes:
// - Auth tables (user, session, account, verification, ...)
// - Collection tables (posts, todos, ...)
// - All indexes and relations
```

## Benefits of This Integration

| Aspect | Benefit |
|--------|---------|
| **Unified API** | Single config for auth + collections |
| **Type Safety** | Full TypeScript inference across auth and data |
| **Provider Agnostic** | Works with pg, mysql, sqlite via providers |
| **Plugin Compatibility** | All Better-Auth plugins work |
| **Schema Merging** | Auth and collection tables in same database |
| **Transaction Support** | Auth ops can be in same transaction as data ops |

## Implementation Roadmap

1. **Phase 1**: Create `@deessejs/collections-auth` package
   - Define auth collections using Collections DSL
   - Implement adapter bridge to provider interface

2. **Phase 2**: Plugin integration
   - Map Better-Auth plugins to collection plugins
   - Handle plugin-specific collections

3. **Phase 3**: CLI integration
   - Schema generation for auth + collections
   - Migration support

4. **Phase 4**: Full compatibility
   - All Better-Auth features via Collections API
   - Hooks, relations, custom fields

## Summary

Integrating Better-Auth with Collections means:

1. **Auth as Collections** - User, session, account are collections
2. **Plugin as Plugin** - Auth plugins become collection plugins
3. **Adapter as Bridge** - Better-Auth adapter uses Collections provider
4. **Unified Config** - Single `defineConfig` for everything
5. **Zero Coupling** - Auth package depends on core, not vice versa
