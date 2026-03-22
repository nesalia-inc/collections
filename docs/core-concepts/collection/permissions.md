# Permissions

Define access control for each CRUD operation.

## Overview

Permissions let you control who can create, read, update, or delete records.

## Basic Permissions

```typescript
export const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    authorId: field({ fieldType: f.text() })
  },

  permissions: {
    // Anyone can create
    create: async ({ user }) => !!user,

    // Everyone can read
    read: async () => true,

    // Only author or admin can update
    update: async ({ user, current }) => {
      if (!user) return false
      return user.role === 'admin' || current.authorId === user.id
    },

    // Only admin can delete
    delete: async ({ user }) => user?.role === 'admin'
  }
})
```

## Permission Return Types

### Boolean Return

Return `true` to allow, `false` to deny:

```typescript
permissions: {
  read: async ({ user }) => user?.role !== 'banned',
  delete: async ({ user }) => user?.role === 'admin'
}
```

### Query Constraints (Read Only)

The `read` permission can return query constraints instead of a boolean. This injects filters directly into the SQL WHERE clause:

```typescript
permissions: {
  // Boolean: allow all
  read: async () => true,

  // Query constraints: filter results
  read: async ({ user }) => {
    if (!user) return { published: true }  // Public sees only published
    if (user.role === 'admin') return true  // Admin sees all

    // Return constraints injected into WHERE
    return {
      OR: [
        { authorId: user.id },
        { published: true }
      ]
    }
  }
}
```

**Why Query Constraints?**
- Boolean permissions reject entire queries for unauthorized users
- Query constraints filter results at the database level (efficient)
- Works with millions of records without performance issues

## Permission Context

Each permission function receives a context object:

```typescript
permissions: {
  create: async ({ user, data }) => {
    // user: Current authenticated user (from session)
    // data: The data being created
    return user?.role === 'admin'
  },

  read: async ({ user, query }) => {
    // user: Current authenticated user
    // query: The query parameters
    return user?.role !== 'banned'
  },

  update: async ({ user, data, current }) => {
    // user: Current authenticated user
    // data: New data being set
    // current: Existing record
    return user?.role === 'admin' || current.ownerId === user?.id
  },

  delete: async ({ user, current }) => {
    // user: Current authenticated user
    // current: Record being deleted
    return user?.role === 'admin'
  }
}
```

## Combining with Hooks

Use permissions for access control and hooks for data manipulation:

```typescript
export const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    status: field({ fieldType: f.select(['draft', 'published']) }),
    authorId: field({ fieldType: f.text() })
  },

  permissions: {
    read: async ({ user }) => true,
    update: async ({ user, current }) => user?.role === 'admin' || current.authorId === user?.id
  },

  hooks: {
    beforeCreate: [
      async ({ data, db }) => {
        // Add author from session
        const session = await db.session()
        data.authorId = session.user.id

        // Auto-set draft for non-admins
        if (session.user.role !== 'admin') {
          data.status = 'draft'
        }

        return data
      }
    ]
  }
})
```
