# Extend Methods (Collection-Level)

Add custom methods at the collection level that can be called directly on the collection.

## Overview

The `extend` property adds methods at the collection level. These are called directly on the collection object.

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() }),
    publishedAt: field({ fieldType: f.timestamp(), required: false })
  },

  // Collection-level methods
  extend: {
    // Publish a post
    publish: async ({ id }, { db, user }) => {
      await db.posts.update({
        where: { id },
        data: { published: true, publishedAt: new Date() }
      })
    },

    // Archive a post
    archive: async ({ id }, { db }) => {
      await db.posts.update({
        where: { id },
        data: { archived: true }
      })
    },

    // Custom method with parameters
    setStatus: async ({ id, status }, { db }) => {
      await db.posts.update({
        where: { id },
        data: { status }
      })
    }
  }
})
```

## Usage

```typescript
// Call extend methods directly on the collection
await db.posts.publish({ id: "123" })
await db.posts.archive({ id: "456" })
await db.posts.setStatus({ id: "789", status: "draft" })
```

## Method Signature

```typescript
extend: {
  methodName: async (params, context) => {
    // params: { id, ...custom parameters }
    // context: { db, user, config }
  }
}
```

## Context

Extend methods receive a context object:

```typescript
extend: {
  myMethod: async (params, { db, user, config }) => {
    // params: { id, ...custom params }
    // db: database instance for CRUD operations
    // user: current authenticated user (if auth enabled)
    // config: the full config object
  }
}
```

## Examples

### Publish/Unpublish

```typescript
extend: {
  publish: async ({ id }, { db }) => {
    await db.posts.update({
      where: { id },
      data: { published: true, publishedAt: new Date() }
    })
  },

  unpublish: async ({ id }, { db }) => {
    await db.posts.update({
      where: { id },
      data: { published: false, publishedAt: null }
    })
  }
}
```

### Bulk Operations

```typescript
extend: {
  publishAll: async ({ ids }, { db }) => {
    await Promise.all(
      ids.map(id =>
        db.posts.update({
          where: { id },
          data: { published: true }
        })
      )
    )
  }
}
```

### With Validation

```typescript
extend: {
  archive: async ({ id, reason }, { db, user }) => {
    // Check permission
    if (user?.role !== 'admin') {
      throw new Error('Only admins can archive posts')
    }

    // Perform action
    await db.posts.update({
      where: { id },
      data: { archived: true, archivedReason: reason }
    })
  }
}
```

## TypeScript

Methods are fully typed:

```typescript
extend: {
  setStatus: async (
    { id, status }: { id: string; status: 'draft' | 'published' },
    { db }: { db: Database }
  ) => {
    // Full type inference
  }
}
```
