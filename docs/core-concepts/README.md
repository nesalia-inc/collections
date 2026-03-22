# Core Concepts

Learn the fundamental concepts of Collections.

## Collections

Collections are the main organizational unit in Collections.

```typescript
import { collection, field, f } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  }
})
```

- [Overview](./collection/README.md) - Introduction
- [Definition](./collection/definition.md) - How to define a collection
- [Structure](./collection/structure.md) - TypeScript type reference
- [Usage](./collection/usage.md) - Using collections in your app

## Data Modeling

```typescript
// Fields
title: field({ fieldType: f.text() })

// Relations
author: field({ fieldType: f.relation({ to: 'users' }) })

// Indexes
email: field({ fieldType: f.text(), indexed: true })
```

- [Fields](./fields/README.md) - Field definitions
- [Relations](./collection/relations.md) - Linking collections
- [Indexes](./collection/indexes.md) - Query performance
- [Auto-Generated Fields](./collection/auto-generated.md) - System fields (id, createdAt, updatedAt)

## Behavior

```typescript
// Hooks
const posts = collection({
  slug: 'posts',
  hooks: {
    beforeCreate: [async ({ data }) => { /* ... */ }]
  }
})

// Permissions
const posts = collection({
  slug: 'posts',
  permissions: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true
  }
})
```

- [Hooks](./hooks.md) - Lifecycle hooks
- [Permissions](./collection/permissions.md) - Access control

## Custom Methods

```typescript
// Collection-level methods
const posts = collection({
  slug: 'posts',
  extend: {
    publish: async function(id) {
      return this.update(id, { published: true })
    }
  }
})

// Instance methods
const posts = collection({
  slug: 'posts',
  methods: {
    publish: async function() {
      this.published = true
      return this.save()
    }
  }
})
```

- [Extend](./collection/extend.md) - Collection-level methods
- [Methods](./collection/methods.md) - Instance methods on records

## Operations

```typescript
// CRUD operations
await posts.create({ title: 'Hello' })
await posts.findMany()
await posts.findOne(id)
await posts.update(id, { title: 'Updated' })
await posts.delete(id)
```

- [Operations](./operations.md) - CRUD operations
- [Virtual Collections](./virtual-collections.md) - Collections defined by plugins (auth tables)

## Configuration

```typescript
import { defineConfig } from '@deessejs/collections'

const config = defineConfig({
  collections: [posts, users],
  database: { provider: 'sqlite', url: './data.db' }
})
```

- [Config](./config/README.md) - Configuration options
- [Return Value](./config/return-value.md) - What defineConfig returns
- [Database Config](./config/database.md) - Database configuration

## Advanced

```typescript
// Dynamic schema at runtime
await posts.addField('lastViewed', field({ fieldType: f.timestamp() }))
```

- [Dynamic Schema](./dynamic-schema.md) - Runtime schema modifications
