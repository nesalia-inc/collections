# Defining a Collection

Learn how to define a collection with all its options.

## Basic Definition

```typescript
import { collection, field, f } from '@deessejs/collections'

export const posts = collection({
  slug: 'posts',

  // Optional: human-readable name
  name: 'Posts',

  // Optional: admin configuration
  admin: {
    description: 'Blog posts and articles'
  },

  // Optional: permissions
  permissions: {
    create: async ({ user }) => !!user,
    read: async ({ user }) => true,
    update: async ({ user, current }) => user?.role === 'admin' || current.authorId === user?.id,
    delete: async ({ user, current }) => user?.role === 'admin'
  },

  // Collection fields
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})
```

## Required Properties

### slug

The unique identifier for the collection:

```typescript
collection({
  slug: 'posts'  // Required - unique identifier
})
```

## Optional Properties

### name

Human-readable name for UI:

```typescript
collection({
  slug: 'posts',
  name: 'Blog Posts'  // Optional - defaults to slug
})
```

### admin

Admin UI configuration:

```typescript
collection({
  slug: 'posts',
  admin: {
    description: 'Blog posts and articles',
    icon: 'document-text'
  }
})
```

### permissions

Access control rules. See [Permissions](./permissions.md) for details.

### fields

The data structure. See [Fields](./fields.md) for details.

### hooks

Lifecycle callbacks. See [Hooks](./hooks.md) for details.

### indexes

Database indexes for performance. See [Indexes](./indexes.md) for details.

### relations

Collection relationships. See [Relations](./relations.md) for details.

### extend

Collection-level methods. See [Extend](./extend.md) for details.

### methods

Instance methods. See [Methods](./methods.md) for details.
